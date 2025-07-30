import { BitcoinHTLCOperations } from './bitcoin-htlc-operations';
import { BitcoinNetworkOperations } from './bitcoin-network-operations';
import { FusionOrderManager } from './fusion-order-manager';
import { BitcoinSwapOrder } from './bitcoin-swap-types';

/**
 * Swap Monitoring Service
 * Handles monitoring of Bitcoin HTLCs and secret reveal detection
 */
export class SwapMonitoringService {
  private htlcOperations: BitcoinHTLCOperations;
  private networkOperations: BitcoinNetworkOperations;
  private orderManager: FusionOrderManager;

  constructor(
    htlcOperations: BitcoinHTLCOperations,
    networkOperations: BitcoinNetworkOperations,
    orderManager: FusionOrderManager
  ) {
    this.htlcOperations = htlcOperations;
    this.networkOperations = networkOperations;
    this.orderManager = orderManager;
  }

  /**
   * Monitor Bitcoin blockchain for secret reveal
   */
  async monitorSecretReveal(
    orderHash: string,
    htlcAddress: string,
    htlcScript: Buffer
  ): Promise<void> {
    console.log(`Monitoring secret reveal for order ${orderHash}`);

    const checkForSpend = async () => {
      try {
        // Check if HTLC has been spent
        const addressHistory = await this.networkOperations.getBitcoinAddressHistory(htlcAddress);
        const spendingTx = addressHistory.find(tx =>
          tx.vin.some((input: any) => input.prevout?.scriptpubkey_address === htlcAddress)
        );

        if (spendingTx) {
          console.log('HTLC spent! Extracting secret...');

          // Extract secret from spending transaction
          const secret = this.htlcOperations.extractSecretFromTransaction(spendingTx, htlcScript);

          if (secret) {
            console.log('Secret revealed:', secret.toString('hex'));

            // Complete Ethereum side swap using 1inch API
            await this.orderManager.completeFusionSwap(orderHash, secret);
            return;
          }
        }

        // Continue monitoring
        setTimeout(checkForSpend, 10000); // Check every 10 seconds

      } catch (error) {
        console.error('Error monitoring secret reveal:', error);
        setTimeout(checkForSpend, 10000);
      }
    };

    await checkForSpend();
  }

  /**
   * Monitor Bitcoin secret reveal for BTC → ERC20 swaps
   */
  async monitorBitcoinSecretReveal(
    orderHash: string,
    sourceTxId: string,
    expectedSecretHash: string
  ): Promise<void> {
    console.log(`Monitoring Bitcoin secret reveal for ${orderHash}`);

    const checkForSpend = async () => {
      try {
        // Monitor the source Bitcoin transaction for when user spends it
        const txHistory = await this.networkOperations.getBitcoinAddressHistory(sourceTxId);

        // Look for spending transaction that reveals the secret
        const spendingTx = txHistory.find(tx => {
          // Check if this transaction spends from the source and reveals the secret
          return tx.vin.some((input: any) => {
            if (input.prevout?.scriptpubkey_address === sourceTxId) {
              // Extract and verify secret from witness data
              if (input.witness && input.witness.length > 1) {
                const secret = Buffer.from(input.witness[1], 'hex');
                const secretHash = require('crypto').createHash('sha256').update(secret).digest();
                const hash160 = require('crypto').createHash('ripemd160').update(secretHash).digest();

                return hash160.toString('hex') === expectedSecretHash;
              }
            }
            return false;
          });
        });

        if (spendingTx) {
          console.log('Bitcoin secret revealed! Completing ERC20 side...');

          // Extract secret and complete ERC20 side
          const secret = this.extractSecretFromBitcoinSpend(spendingTx);
          if (secret) {
            await this.orderManager.completeFusionSwap(orderHash, secret);
            return;
          }
        }

        // Continue monitoring
        setTimeout(checkForSpend, 10000);

      } catch (error) {
        console.error('Error monitoring Bitcoin secret reveal:', error);
        setTimeout(checkForSpend, 10000);
      }
    };

    await checkForSpend();
  }

  /**
   * Extract secret from Bitcoin spending transaction
   */
  private extractSecretFromBitcoinSpend(spendingTx: any): Buffer | null {
    try {
      const htlcInput = spendingTx.vin[0]; // Assuming first input

      if (htlcInput.witness && htlcInput.witness.length > 1) {
        return Buffer.from(htlcInput.witness[1], 'hex');
      }

      return null;

    } catch (error) {
      console.error('Error extracting secret from Bitcoin spend:', error);
      return null;
    }
  }

  /**
   * Handle ERC20 → BTC swap execution
   */
  async handleERC20ToBTCSwap(order: BitcoinSwapOrder): Promise<void> {
    try {
      const extension = order.extension;
      const secretHash = Buffer.from(extension.secretHash, 'hex');
      const recipientPubKey = Buffer.from(extension.recipientPublicKey!, 'hex');
      const lockTimeBlocks = await this.networkOperations.getCurrentBlockHeight() + 144; // ~24 hours

      // 1. Create Bitcoin HTLC script
      const htlcScript = this.htlcOperations.createBitcoinHTLCScript({
        secretHash,
        recipientPublicKey,
        lockTimeBlocks
      });

      // 2. Create P2SH address for HTLC
      const htlcAddress = this.htlcOperations.createHTLCAddress(htlcScript);

      console.log(`Bitcoin HTLC address: ${htlcAddress}`);

      // 3. Fund the HTLC with Bitcoin
      const fundingTxId = await this.networkOperations.fundBitcoinHTLC({
        htlcAddress,
        amountSatoshis: parseInt(extension.destinationAmount!)
      });

      console.log(`Bitcoin HTLC funded: ${fundingTxId}`);

      // 4. Notify 1inch network about Bitcoin deposit
      await this.orderManager.notifyBitcoinDeposit(order.orderHash, fundingTxId, htlcAddress);

      // 5. Monitor for secret reveal
      await this.monitorSecretReveal(order.orderHash, htlcAddress, htlcScript);

    } catch (error) {
      console.error('Error handling ERC20→BTC swap:', error);
    }
  }

  /**
   * Lock ERC20 tokens in Ethereum escrow for BTC → ERC20 swap
   */
  private async lockERC20TokensInEscrow(order: BitcoinSwapOrder): Promise<void> {
    try {
      const extension = order.extension;

      // Use 1inch Fusion API to lock ERC20 tokens
      // This creates an escrow that will be released when the secret is revealed
      const escrowResponse = await this.orderManager.createERC20Escrow({
        orderHash: order.orderHash,
        tokenAddress: order.takerAsset,
        amount: order.takerAmount,
        secretHash: extension.secretHash,
        timelock: extension.timelock || Math.floor(Date.now() / 1000) + 86400
      });

      console.log('ERC20 tokens locked in escrow:', escrowResponse.escrowAddress);
      console.log('Escrow transaction hash:', escrowResponse.txHash);

    } catch (error) {
      console.error('Error locking ERC20 tokens in escrow:', error);
      throw error;
    }
  }

  /**
   * Handle BTC → ERC20 swap execution
   */
  async handleBTCToERC20Swap(order: BitcoinSwapOrder): Promise<void> {
    try {
      const extension = order.extension;

      if (!extension.sourceTxId || !extension.sourceAmount) {
        throw new Error('Source transaction ID and amount are required for BTC to ERC20 swaps');
      }

      // 1. Verify user's Bitcoin transaction
      const btcTxValid = await this.networkOperations.verifyBitcoinTransaction(
        extension.sourceTxId,
        extension.sourceAmount
      );

      if (!btcTxValid) {
        throw new Error('Invalid Bitcoin transaction');
      }

      // 2. Lock ERC20 tokens in Ethereum escrow using 1inch Fusion
      await this.lockERC20TokensInEscrow(order);

      // 3. Monitor for secret reveal from user's Bitcoin claim
      await this.monitorBitcoinSecretReveal(
        order.orderHash,
        extension.sourceTxId,
        extension.secretHash
      );

    } catch (error) {
      console.error('Error handling BTC→ERC20 swap:', error);
    }
  }
} 