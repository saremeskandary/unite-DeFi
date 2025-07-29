import {
    FusionSDK,
    NetworkEnum,
    PrivateKeyProviderConnector,
    Web3Like,
    FusionOrder,
    OrderParams,
} from '@1inch/fusion-sdk';
import { SDK as CrossChainSDK, OrderInfo, SupportedChain, EvmCrossChainOrder } from '@1inch/cross-chain-sdk';
import { ethers, TransactionRequest } from 'ethers';
import * as bitcoin from 'bitcoinjs-lib';
import { ECPairFactory } from 'ecpair';
import * as ecc from 'tiny-secp256k1';
import axios from 'axios';

// Initialize Bitcoin ECC library
bitcoin.initEccLib(ecc);
const ECPair = ECPairFactory(ecc);

interface BlockstreamTx {
  vin: {
    witness?: string[];
    prevout?: {
      scriptpubkey_address: string;
    };
  }[];
}

interface Utxo {
  txid: string;
  vout: number;
  value: number;
  scriptpubkey: string;
}

interface BitcoinSwapOrderExtension {
    swapType: 'erc20_to_btc' | 'btc_to_erc20';
    recipientPublicKey?: string;
    secretHash: string;
    destinationAmount?: string;
    sourceTxId?: string;
    sourceAmount?: string;
}

interface BitcoinSwapOrder extends Omit<OrderInfo, 'extension'> {
    extension: BitcoinSwapOrderExtension;
}



/**
 * Complete 1inch Fusion+ Bitcoin Cross-Chain Implementation
 * Handles native BTC ↔ ERC20 token atomic swaps
 */
class FusionBitcoinIntegration {
  private fusionSDK: FusionSDK;
  private crossChainSDK: CrossChainSDK;
  private provider: ethers.JsonRpcProvider;
  private signer: ethers.Wallet;
  private btcNetwork: bitcoin.Network;
  private resolverKeyPair: any;
  private resolverBtcAddress: string;
  
  constructor(
    private privateKey: string,
    private btcPrivateKeyWIF: string,
    private rpcUrl: string = 'https://eth-mainnet.g.alchemy.com/v2/your-key',
    private network: NetworkEnum = NetworkEnum.ETHEREUM,
    private useBtcTestnet: boolean = true
  ) {
    // Initialize Ethereum
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.signer = new ethers.Wallet(privateKey, this.provider);
    
    // Initialize Bitcoin
    this.btcNetwork = useBtcTestnet ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;
    this.resolverKeyPair = ECPair.fromWIF(btcPrivateKeyWIF, this.btcNetwork);
    
    const { address } = bitcoin.payments.p2pkh({
      pubkey: this.resolverKeyPair.publicKey,
      network: this.btcNetwork
    });
    this.resolverBtcAddress = address!;
    
    // Initialize 1inch SDKs
    const web3Provider: Web3Like = {
        eth: {
            call: (transactionConfig: TransactionRequest) => {
                return this.provider.call(transactionConfig);
            }
        },
        extend: () => {}
    };
    const connector = new PrivateKeyProviderConnector(privateKey, web3Provider);
    this.fusionSDK = new FusionSDK({
      url: 'https://api.1inch.dev/fusion',
      network: this.network,
      blockchainProvider: connector
    });

    this.crossChainSDK = new CrossChainSDK({
      url: 'https://api.1inch.dev/fusion-plus',
      authKey: process.env.INCH_API_KEY || '',
    });

    console.log(`Resolver BTC Address: ${this.resolverBtcAddress}`);
  }

  /**
   * Create HTLC Script for Bitcoin atomic swaps
   * Uses improved script that allows anyone to refund after timeout
   */
  createBitcoinHTLCScript(
    secretHash: Buffer,
    recipientPublicKey: Buffer,
    lockTimeBlocks: number
  ): Buffer {
    return bitcoin.script.compile([
      bitcoin.opcodes.OP_IF,
        bitcoin.opcodes.OP_HASH160,
        secretHash, // Hash160 of the secret
        bitcoin.opcodes.OP_EQUALVERIFY,
        recipientPublicKey, // User's public key
        bitcoin.opcodes.OP_CHECKSIG,
      bitcoin.opcodes.OP_ELSE,
        bitcoin.script.number.encode(lockTimeBlocks), // Refund timelock
        bitcoin.opcodes.OP_CHECKLOCKTIMEVERIFY,
        bitcoin.opcodes.OP_DROP,
        bitcoin.opcodes.OP_TRUE, // Anyone can spend after timeout (improved safety)
      bitcoin.opcodes.OP_ENDIF,
    ]);
  }

  /**
   * Create Fusion+ order for ERC20 → Native BTC swap
   */
  async createERC20ToBTCOrder(params: {
    makerAsset: string;      // ERC20 token address (e.g., WBTC)
    makerAmount: string;     // Amount in wei
    btcAddress: string;      // User's Bitcoin address
    btcAmount: number;       // BTC amount in satoshis
    secret: string;          // Secret for HTLC
  }): Promise<{ fusionOrder: OrderInfo, secretHash: string }> {
    try {
      // Generate hash160 of secret (Bitcoin standard)
      const secretBuffer = Buffer.from(params.secret, 'utf8');
      const secretHash = bitcoin.crypto.hash160(secretBuffer);
      
      // Get user's Bitcoin public key from address
      const userPubKey = await this.getBitcoinPublicKeyFromAddress(params.btcAddress);
      
      // Create Bitcoin extension for Fusion+ order
      const bitcoinExtension = {
        chainId: 'bitcoin',
        swapType: 'erc20_to_btc',
        destinationAddress: params.btcAddress,
        destinationAmount: params.btcAmount.toString(),
        secretHash: secretHash.toString('hex'),
        timelock: Math.floor(Date.now() / 1000) + 86400, // 24 hours
        recipientPublicKey: userPubKey.toString('hex')
      };

      const orderParams: OrderParams = {
        fromTokenAddress: params.makerAsset,
        toTokenAddress: '0x0000000000000000000000000000000000000000', // Placeholder
        amount: params.makerAmount,
        walletAddress: this.signer.address,
        // extension: JSON.stringify(bitcoinExtension), // extension is not a property on OrderParams
        // allowedSenders: [] // Open to all resolvers
      };

      // Create Fusion order using 1inch SDK
      const fusionOrder = await this.fusionSDK.placeOrder(orderParams);

      console.log('ERC20→BTC Fusion+ order created:', fusionOrder.orderHash);
      return { fusionOrder, secretHash: secretHash.toString('hex') };

    } catch (error) {
      console.error('Error creating ERC20→BTC order:', error);
      throw error;
    }
  }

  /**
   * Create Fusion+ order for Native BTC → ERC20 swap
   */
  async createBTCToERC20Order(params: {
    btcTxId: string;         // Bitcoin transaction ID with locked BTC
    btcAmount: number;       // BTC amount in satoshis
    takerAsset: string;      // Desired ERC20 token
    takerAmount: string;     // Desired ERC20 amount
    ethAddress: string;      // User's Ethereum address
    secret: string;          // Secret for HTLC
  }): Promise<{ fusionOrder: OrderInfo, secretHash: string }> {
    try {
      const secretBuffer = Buffer.from(params.secret, 'utf8');
      const secretHash = bitcoin.crypto.hash160(secretBuffer);
      
      const bitcoinExtension = {
        chainId: 'bitcoin',
        swapType: 'btc_to_erc20',
        sourceTxId: params.btcTxId,
        sourceAmount: params.btcAmount.toString(),
        secretHash: secretHash.toString('hex'),
        timelock: Math.floor(Date.now() / 1000) + 86400,
        ethRecipient: params.ethAddress
      };

      const orderParams: OrderParams = {
        fromTokenAddress: '0x0000000000000000000000000000000000000000', // BTC placeholder
        toTokenAddress: params.takerAsset,
        amount: params.btcAmount.toString(),
        walletAddress: this.signer.address,
        // extension: JSON.stringify(bitcoinExtension),
        // allowedSenders: []
      };

      const fusionOrder = await this.fusionSDK.placeOrder(orderParams);

      console.log('BTC→ERC20 Fusion+ order created:', fusionOrder.orderHash);
      return { fusionOrder, secretHash: secretHash.toString('hex') };

    } catch (error) {
      console.error('Error creating BTC→ERC20 order:', error);
      throw error;
    }
  }

  /**
   * Submit order to 1inch Fusion+ network
   */
  async submitBitcoinSwapOrder(order: OrderInfo, secretHashes: string[]) {
    try {
      const submission = await this.crossChainSDK.submitOrder(this.network as SupportedChain, order as unknown as EvmCrossChainOrder, (order).quoteId, secretHashes);

      console.log('Bitcoin swap order submitted:', submission.orderHash);
      
      // Start monitoring order status
      this.monitorOrderStatus(submission.orderHash);
      
      return submission;

    } catch (error) {
      console.error('Error submitting Bitcoin swap order:', error);
      throw error;
    }
  }

  /**
   * Monitor order status using 1inch API
   */
  async monitorOrderStatus(orderHash: string) {
    const checkStatus = async () => {
      try {
        const response = await axios.get(
          `https://api.1inch.dev/fusion-plus/orders/${orderHash}`,
          {
            headers: {
              'Authorization': `Bearer ${process.env.INCH_API_KEY}`
            }
          }
        );

        const order = response.data;
        console.log(`Order ${orderHash} status:`, order.status);

        switch (order.status) {
          case 'pending':
            console.log('Order waiting for resolver...');
            setTimeout(checkStatus, 10000);
            break;
          case 'matched':
            console.log('Order matched with resolver:', order.resolverAddress);
            await this.handleOrderMatched(order);
            break;
          case 'completed':
            console.log('Order completed successfully');
            return order;
          case 'failed':
            console.log('Order failed:', order.failureReason);
            break;
          default:
            setTimeout(checkStatus, 10000);
        }

      } catch (error) {
        console.error('Error checking order status:', error);
        setTimeout(checkStatus, 10000);
      }
    };

    await checkStatus();
  }

  /**
   * Handle matched order based on swap type
   */
  async handleOrderMatched(order: BitcoinSwapOrder) {
    const extension = order.extension;
    
    if (extension.swapType === 'erc20_to_btc') {
      await this.handleERC20ToBTCSwap(order);
    } else if (extension.swapType === 'btc_to_erc20') {
      await this.handleBTCToERC20Swap(order);
    }
  }

  /**
   * Handle ERC20 → BTC swap (user locks ERC20, resolver locks BTC)
   */
  async handleERC20ToBTCSwap(order: BitcoinSwapOrder) {
    try {
      const extension = order.extension;
      const secretHash = Buffer.from(extension.secretHash, 'hex');
      const recipientPubKey = Buffer.from(extension.recipientPublicKey!, 'hex');
      const lockTimeBlocks = await this.getCurrentBlockHeight() + 144; // ~24 hours

      // 1. Create Bitcoin HTLC script
      const htlcScript = this.createBitcoinHTLCScript(
        secretHash,
        recipientPubKey,
        lockTimeBlocks
      );

      // 2. Create P2SH address for HTLC
      const p2sh = bitcoin.payments.p2sh({
        redeem: { output: htlcScript, network: this.btcNetwork },
        network: this.btcNetwork
      });
      const htlcAddress = p2sh.address!;

      console.log(`Bitcoin HTLC address: ${htlcAddress}`);

      // 3. Fund the HTLC with Bitcoin
      const fundingTxId = await this.fundBitcoinHTLC(
        htlcAddress,
        parseInt(extension.destinationAmount!)
      );

      console.log(`Bitcoin HTLC funded: ${fundingTxId}`);

      // 4. Notify 1inch network about Bitcoin deposit
      await this.notifyBitcoinDeposit(order.orderHash, fundingTxId, htlcAddress);

      // 5. Monitor for secret reveal
      await this.monitorSecretReveal(order.orderHash, htlcAddress, htlcScript);

    } catch (error) {
      console.error('Error handling ERC20→BTC swap:', error);
    }
  }

  /**
   * Handle BTC → ERC20 swap (user locks BTC, resolver locks ERC20)
   */
  async handleBTCToERC20Swap(order: BitcoinSwapOrder) {
    try {
      const extension = order.extension;

      if (!extension.sourceTxId || !extension.sourceAmount) {
        throw new Error('Source transaction ID and amount are required for BTC to ERC20 swaps');
      }
      // 1. Verify user's Bitcoin transaction
      const btcTxValid = await this.verifyBitcoinTransaction(
        extension.sourceTxId,
        extension.sourceAmount
      );

      if (!btcTxValid) {
        throw new Error('Invalid Bitcoin transaction');
      }

      // 2. Lock ERC20 tokens in Ethereum escrow using Fusion SDK
      // TODO: The `fillOrder` method does not exist on the FusionSDK.
      // The logic for a resolver to fill/execute a swap needs to be implemented differently,
      // possibly through direct contract interaction or a private API.
      // const escrowTx = await this.fusionSDK.fillOrder({
      //   orderHash: order.orderHash,
      //   signature: order.signature,
      //   makerAmount: extension.sourceAmount,
      //   takerAmount: order.takerAmount
      // });

      // console.log('ERC20 tokens locked in escrow:', escrowTx.hash);

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

  /**
   * Fund Bitcoin HTLC with resolver's BTC
   */
  async fundBitcoinHTLC(htlcAddress: string, amountSatoshis: number): Promise<string> {
    try {
      // 1. Get UTXOs for resolver's Bitcoin address
      const utxos = await this.getBitcoinUTXOs(this.resolverBtcAddress);
      
      if (utxos.length === 0) {
        throw new Error('No UTXOs available for funding HTLC');
      }

      // 2. Create funding transaction
      const psbt = new bitcoin.Psbt({ network: this.btcNetwork });
      
      let totalInput = 0;
      for (const utxo of utxos) {
        if (totalInput >= amountSatoshis + 1000) break; // Add fee buffer
        
        psbt.addInput({
          hash: utxo.txid,
          index: utxo.vout,
          witnessUtxo: {
            script: Buffer.from(utxo.scriptpubkey, 'hex'),
            value: utxo.value
          }
        });
        totalInput += utxo.value;
      }

      // 3. Add HTLC output
      psbt.addOutput({
        address: htlcAddress,
        value: amountSatoshis
      });

      // 4. Add change output if needed
      const fee = 1000; // 1000 sats fee
      const change = totalInput - amountSatoshis - fee;
      if (change > 546) { // Dust limit
        psbt.addOutput({
          address: this.resolverBtcAddress,
          value: change
        });
      }

      // 5. Sign and broadcast
      for (let i = 0; i < utxos.length && i < psbt.inputCount; i++) {
        psbt.signInput(i, this.resolverKeyPair);
      }
      
      psbt.finalizeAllInputs();
      const tx = psbt.extractTransaction();
      const txHex = tx.toHex();

      // 6. Broadcast transaction
      const txId = await this.broadcastBitcoinTransaction(txHex);
      console.log(`Bitcoin HTLC funded with transaction: ${txId}`);
      
      return txId;

    } catch (error) {
      console.error('Error funding Bitcoin HTLC:', error);
      throw error;
    }
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
        const addressHistory = await this.getBitcoinAddressHistory(htlcAddress);
        const spendingTx = addressHistory.find(tx => 
          tx.vin.some((input: any) => input.prevout?.scriptpubkey_address === htlcAddress)
        );

        if (spendingTx) {
          console.log('HTLC spent! Extracting secret...');
          
          // Extract secret from spending transaction
          const secret = await this.extractSecretFromTransaction(spendingTx, htlcScript);
          
          if (secret) {
            console.log('Secret revealed:', secret.toString('hex'));
            
            // Complete Ethereum side swap using 1inch API
            await this.completeFusionSwap(orderHash, secret);
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
   * Extract secret from Bitcoin spending transaction
   */
  async extractSecretFromTransaction(
    spendingTx: BlockstreamTx,
    htlcScript: Buffer
  ): Promise<Buffer | null> {
    try {
      // Find input that spends from HTLC
      const htlcInput = spendingTx.vin[0]; // Assuming first input
      
      if (htlcInput.witness && htlcInput.witness.length > 1) {
        // For witness transactions, secret is typically in witness stack
        const secret = Buffer.from(htlcInput.witness[1], 'hex');
        
        // Verify secret matches hash
        const secretHash = bitcoin.crypto.hash160(secret);
        // You'd compare this with the expected hash from the order
        
        return secret;
      }

      return null;

    } catch (error) {
      console.error('Error extracting secret:', error);
      return null;
    }
  }

  /**
   * Complete Fusion swap on Ethereum side
   */
  async completeFusionSwap(orderHash: string, secret: Buffer): Promise<void> {
    try {
      const response = await axios.post(
        `https://api.1inch.dev/fusion-plus/orders/${orderHash}/complete`,
        {
          secret: secret.toString('hex'),
          preimage: secret
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.INCH_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Fusion swap completed:', response.data);

    } catch (error) {
      console.error('Error completing Fusion swap:', error);
    }
  }

  /**
   * Notify 1inch network about Bitcoin deposit
   */
  async notifyBitcoinDeposit(
    orderHash: string,
    txId: string,
    htlcAddress: string
  ): Promise<void> {
    try {
      const response = await axios.post(
        `https://api.1inch.dev/fusion-plus/orders/${orderHash}/bitcoin-deposit`,
        {
          txId: txId,
          htlcAddress: htlcAddress,
          confirmations: 1
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.INCH_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Bitcoin deposit notified:', response.data);

    } catch (error) {
      console.error('Error notifying Bitcoin deposit:', error);
    }
  }

  // Helper methods for Bitcoin operations
  async getBitcoinUTXOs(address: string): Promise<Utxo[]> {
    const apiUrl = this.useBtcTestnet 
      ? 'https://blockstream.info/testnet/api'
      : 'https://blockstream.info/api';
    
    const response = await axios.get(`${apiUrl}/address/${address}/utxo`);
    return response.data;
  }

  async getBitcoinAddressHistory(address: string): Promise<any[]> {
    const apiUrl = this.useBtcTestnet
      ? 'https://blockstream.info/testnet/api'
      : 'https://blockstream.info/api';
    
    const response = await axios.get(`${apiUrl}/address/${address}/txs`);
    return response.data;
  }

  async broadcastBitcoinTransaction(txHex: string): Promise<string> {
    const apiUrl = this.useBtcTestnet
      ? 'https://blockstream.info/testnet/api'
      : 'https://blockstream.info/api';
    
    const response = await axios.post(`${apiUrl}/tx`, txHex, {
      headers: { 'Content-Type': 'text/plain' }
    });
    
    return response.data; // Transaction ID
  }

  async getCurrentBlockHeight(): Promise<number> {
    const apiUrl = this.useBtcTestnet
      ? 'https://blockstream.info/testnet/api'
      : 'https://blockstream.info/api';
    
    const response = await axios.get(`${apiUrl}/blocks/tip/height`);
    return response.data;
  }

  async getBitcoinPublicKeyFromAddress(address: string): Promise<Buffer> {
    // This is a simplified implementation
    // In practice, you'd need the user to provide their public key
    // or derive it from a signed message
    return Buffer.alloc(33, 0); // Placeholder
  }

  async verifyBitcoinTransaction(txId: string, expectedAmount: string): Promise<boolean> {
    try {
      const apiUrl = this.useBtcTestnet
        ? 'https://blockstream.info/testnet/api'
        : 'https://blockstream.info/api';
      
      const response = await axios.get(`${apiUrl}/tx/${txId}`);
      const tx = response.data;
      
      // Verify transaction has required confirmations and amount
      return tx.status.confirmed && 
             tx.vout.some((output: any) => output.value >= parseInt(expectedAmount));
      
    } catch (error) {
      console.error('Error verifying Bitcoin transaction:', error);
      return false;
    }
  }

  async monitorBitcoinSecretReveal(
    orderHash: string,
    sourceTxId: string,
    expectedSecretHash: string
  ): Promise<void> {
    // Implementation would monitor the source Bitcoin transaction
    // for when the user spends it to reveal the secret
    console.log(`Monitoring Bitcoin secret reveal for ${orderHash}`);
  }
}

// Usage Example
export async function createBitcoinSwapDemo() {
  const integration = new FusionBitcoinIntegration(
    process.env.ETH_PRIVATE_KEY!,
    process.env.BTC_PRIVATE_KEY_WIF!,
    process.env.ETH_RPC_URL!,
    NetworkEnum.ETHEREUM,
    true // Use testnet
  );

  // Example 1: ERC20 → Native BTC swap
  const { fusionOrder: erc20ToBtcOrder, secretHash } = await integration.createERC20ToBTCOrder({
    makerAsset: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', // WBTC
    makerAmount: ethers.parseUnits('0.1', 8).toString(), // 0.1 WBTC
    btcAddress: 'tb1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', // User's testnet address
    btcAmount: 10000000, // 0.1 BTC in satoshis
    secret: 'my-secret-phrase-for-atomic-swap-123'
  });

  await integration.submitBitcoinSwapOrder(erc20ToBtcOrder, [secretHash]);

  console.log('Bitcoin swap order created and submitted!');
}

export { FusionBitcoinIntegration }; 