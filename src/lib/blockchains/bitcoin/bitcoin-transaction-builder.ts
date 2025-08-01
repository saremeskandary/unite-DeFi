import { BitcoinHTLCOperations } from './bitcoin-htlc-operations';
import { BitcoinNetworkOperations } from './bitcoin-network-operations';

export interface BitcoinTransactionData {
  rawTransaction: string;
  transactionHex: string;
  inputs: BitcoinInput[];
  outputs: BitcoinOutput[];
  fee: number;
  totalAmount: number;
  changeAmount: number;
  explanation: string;
  opcodes: OpcodeExplanation[];
  instructions: string[];
  warnings: string[];
}

export interface BitcoinInput {
  txid: string;
  vout: number;
  amount: number;
  address: string;
  scriptPubKey: string;
  sequence: number;
}

export interface BitcoinOutput {
  address: string;
  amount: number;
  scriptPubKey: string;
  type: 'recipient' | 'change' | 'htlc';
}

export interface OpcodeExplanation {
  opcode: string;
  name: string;
  description: string;
  purpose: string;
  example?: string;
}

export interface HTLCTransactionParams {
  secretHash: string;
  recipientAddress: string;
  lockTime: number;
  amount: number;
  feeRate: number;
  userAddress: string;
  utxos: any[];
}

/**
 * Bitcoin Transaction Builder
 * 
 * This class generates raw Bitcoin transactions for HTLC swaps
 * that users can copy and sign with their Bitcoin wallets
 */
export class BitcoinTransactionBuilder {
  private htlcOperations: BitcoinHTLCOperations;
  private networkOperations: BitcoinNetworkOperations;

  constructor(
    private useBtcTestnet: boolean = true
  ) {
    this.htlcOperations = new BitcoinHTLCOperations(useBtcTestnet);
    this.networkOperations = new BitcoinNetworkOperations('', useBtcTestnet);
  }

  /**
   * Build HTLC funding transaction
   */
  async buildHTLCFundingTransaction(params: HTLCTransactionParams): Promise<BitcoinTransactionData> {
    try {
      // 1. Create HTLC script
      const htlcScript = this.htlcOperations.createBitcoinHTLCScript({
        secretHash: Buffer.from(params.secretHash, 'hex'),
        recipientPublicKey: Buffer.from(params.recipientAddress, 'hex'),
        lockTimeBlocks: params.lockTime
      });

      // 2. Create HTLC address
      const htlcAddress = this.htlcOperations.createHTLCAddress(htlcScript);

      // 3. Select UTXOs for funding
      const selectedUtxos = this.selectUTXOs(params.utxos, params.amount, params.feeRate);

      // 4. Calculate fees and change
      const totalInput = selectedUtxos.reduce((sum, utxo) => sum + utxo.value, 0);
      const estimatedFee = this.estimateTransactionFee(selectedUtxos.length, 2, params.feeRate);
      const changeAmount = totalInput - params.amount - estimatedFee;

      // 5. Build transaction
      const transaction = this.buildTransaction({
        inputs: selectedUtxos,
        outputs: [
          {
            address: htlcAddress,
            amount: params.amount,
            type: 'htlc'
          },
          {
            address: params.userAddress,
            amount: changeAmount,
            type: 'change'
          }
        ],
        lockTime: params.lockTime
      });

      // 6. Generate explanations
      const explanation = this.generateHTLCExplanation(params, htlcAddress);
      const opcodes = this.explainHTLCOpcodes(htlcScript);
      const instructions = this.generateSigningInstructions();
      const warnings = this.generateWarnings(params);

      return {
        rawTransaction: transaction.rawTx,
        transactionHex: transaction.hex,
        inputs: selectedUtxos.map(utxo => ({
          txid: utxo.txid,
          vout: utxo.vout,
          amount: utxo.value,
          address: utxo.address,
          scriptPubKey: utxo.scriptPubKey,
          sequence: 0xffffffff
        })),
        outputs: [
          {
            address: htlcAddress,
            amount: params.amount,
            scriptPubKey: this.generateScriptPubKey(htlcAddress),
            type: 'htlc'
          },
          {
            address: params.userAddress,
            amount: changeAmount,
            scriptPubKey: this.generateScriptPubKey(params.userAddress),
            type: 'change'
          }
        ],
        fee: estimatedFee,
        totalAmount: totalInput,
        changeAmount,
        explanation,
        opcodes,
        instructions,
        warnings
      };

    } catch (error) {
      throw new Error(`Failed to build HTLC transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Build HTLC spending transaction (for claiming with secret)
   */
  async buildHTLCSpendingTransaction(
    htlcAddress: string,
    secret: string,
    recipientAddress: string,
    amount: number,
    feeRate: number
  ): Promise<BitcoinTransactionData> {
    try {
      // 1. Create spending transaction
      const transaction = this.buildSpendingTransaction({
        htlcAddress,
        secret,
        recipientAddress,
        amount,
        feeRate
      });

      // 2. Generate explanations
      const explanation = this.generateSpendingExplanation(secret, recipientAddress);
      const opcodes = this.explainSpendingOpcodes(secret);
      const instructions = this.generateSpendingInstructions();
      const warnings = this.generateSpendingWarnings();

      return {
        rawTransaction: transaction.rawTx,
        transactionHex: transaction.hex,
        inputs: [{
          txid: 'HTLC_OUTPUT',
          vout: 0,
          amount,
          address: htlcAddress,
          scriptPubKey: 'HTLC_SCRIPT',
          sequence: 0xffffffff
        }],
        outputs: [{
          address: recipientAddress,
          amount: amount - transaction.fee,
          scriptPubKey: this.generateScriptPubKey(recipientAddress),
          type: 'recipient'
        }],
        fee: transaction.fee,
        totalAmount: amount,
        changeAmount: 0,
        explanation,
        opcodes,
        instructions,
        warnings
      };

    } catch (error) {
      throw new Error(`Failed to build HTLC spending transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Select UTXOs for transaction
   */
  private selectUTXOs(utxos: any[], amount: number, feeRate: number): any[] {
    // Simple UTXO selection - in production, use more sophisticated algorithms
    let selectedUtxos: any[] = [];
    let totalValue = 0;

    for (const utxo of utxos) {
      selectedUtxos.push(utxo);
      totalValue += utxo.value;

      if (totalValue >= amount + this.estimateTransactionFee(selectedUtxos.length, 2, feeRate)) {
        break;
      }
    }

    if (totalValue < amount + this.estimateTransactionFee(selectedUtxos.length, 2, feeRate)) {
      throw new Error('Insufficient funds for transaction');
    }

    return selectedUtxos;
  }

  /**
   * Estimate transaction fee
   */
  private estimateTransactionFee(inputCount: number, outputCount: number, feeRate: number): number {
    // Base transaction size: 4 bytes version + 1 byte input count + inputs + 1 byte output count + outputs + 4 bytes locktime
    const baseSize = 4 + 1 + 4 + outputCount * 9 + 4;
    const inputSize = inputCount * 148; // Average input size
    const outputSize = outputCount * 34; // Average output size
    const totalSize = baseSize + inputSize + outputSize;

    return Math.ceil(totalSize * feeRate / 1000); // feeRate in satoshis per byte
  }

  /**
   * Build raw transaction
   */
  private buildTransaction(params: {
    inputs: any[];
    outputs: any[];
    lockTime: number;
  }): { rawTx: string; hex: string; fee: number } {
    // This is a simplified version - in production, use a proper Bitcoin library
    const version = 0x02000000;
    const inputCount = params.inputs.length;
    const outputCount = params.outputs.length;
    const lockTime = params.lockTime;

    // Build transaction hex (simplified)
    let hex = version.toString(16).padStart(8, '0');
    hex += inputCount.toString(16).padStart(2, '0');

    // Add inputs
    for (const input of params.inputs) {
      hex += this.reverseHex(input.txid);
      hex += input.vout.toString(16).padStart(8, '0');
      hex += '00'; // Empty script for now
      hex += 'ffffffff'; // Sequence
    }

    // Add outputs
    hex += outputCount.toString(16).padStart(2, '0');
    for (const output of params.outputs) {
      const amountHex = Math.floor(output.amount * 100000000).toString(16).padStart(16, '0');
      hex += amountHex;
      hex += this.generateScriptPubKey(output.address);
    }

    hex += lockTime.toString(16).padStart(8, '0');

    return {
      rawTx: hex,
      hex: hex,
      fee: 0 // Calculate actual fee
    };
  }

  /**
   * Build spending transaction
   */
  private buildSpendingTransaction(params: {
    htlcAddress: string;
    secret: string;
    recipientAddress: string;
    amount: number;
    feeRate: number;
  }): { rawTx: string; hex: string; fee: number } {
    // Simplified spending transaction
    const fee = this.estimateTransactionFee(1, 1, params.feeRate);

    return {
      rawTx: 'SPENDING_TX_HEX',
      hex: 'SPENDING_TX_HEX',
      fee
    };
  }

  /**
   * Generate HTLC explanation
   */
  private generateHTLCExplanation(params: HTLCTransactionParams, htlcAddress: string): string {
    return `This transaction creates a Hash Time-Locked Contract (HTLC) on the Bitcoin blockchain.

Purpose: This HTLC locks ${params.amount} BTC for a cross-chain swap. The funds can only be claimed by:
1. The recipient with the correct secret (for successful swap completion)
2. The sender after the time lock expires (for refund if swap fails)

Key Details:
- HTLC Address: ${htlcAddress}
- Lock Time: ${params.lockTime} blocks (~${Math.floor(params.lockTime / 6)} hours)
- Secret Hash: ${params.secretHash}
- Recipient: ${params.recipientAddress}

The HTLC uses Bitcoin's scripting language to enforce these conditions trustlessly.`;
  }

  /**
   * Explain HTLC opcodes
   */
  private explainHTLCOpcodes(htlcScript: Buffer): OpcodeExplanation[] {
    return [
      {
        opcode: 'OP_IF',
        name: 'If Statement',
        description: 'Conditional execution - if the condition is true, execute the following code block',
        purpose: 'Checks if the secret is provided (non-zero)',
        example: 'OP_IF [secret] OP_HASH160 [secretHash] OP_EQUALVERIFY'
      },
      {
        opcode: 'OP_HASH160',
        name: 'Hash160',
        description: 'Performs SHA256 followed by RIPEMD160 hashing',
        purpose: 'Hashes the provided secret to compare with the expected hash',
        example: 'OP_HASH160 [secret] -> [hash160_result]'
      },
      {
        opcode: 'OP_EQUALVERIFY',
        name: 'Equal Verify',
        description: 'Compares two values and fails if they are not equal',
        purpose: 'Verifies that the provided secret matches the expected hash',
        example: '[hash1] [hash2] OP_EQUALVERIFY'
      },
      {
        opcode: 'OP_ELSE',
        name: 'Else Statement',
        description: 'Alternative execution path if the previous condition was false',
        purpose: 'Handles the refund case when no secret is provided',
        example: 'OP_IF [condition] OP_ELSE [alternative] OP_ENDIF'
      },
      {
        opcode: 'OP_CHECKLOCKTIMEVERIFY',
        name: 'Check Lock Time Verify',
        description: 'Verifies that the transaction lock time has passed',
        purpose: 'Ensures the refund can only happen after the time lock expires',
        example: '[locktime] OP_CHECKLOCKTIMEVERIFY'
      },
      {
        opcode: 'OP_DROP',
        name: 'Drop',
        description: 'Removes the top item from the stack',
        purpose: 'Cleans up the stack after verification',
        example: '[value] OP_DROP'
      },
      {
        opcode: 'OP_CHECKSIG',
        name: 'Check Signature',
        description: 'Verifies a signature against a public key',
        purpose: 'Ensures only the authorized party can spend the funds',
        example: '[signature] [publicKey] OP_CHECKSIG'
      }
    ];
  }

  /**
   * Generate signing instructions
   */
  private generateSigningInstructions(): string[] {
    return [
      '1. Copy the raw transaction hex below',
      '2. Open your Bitcoin wallet (Electrum, Bitcoin Core, etc.)',
      '3. Go to the "Sign Transaction" or "Advanced" section',
      '4. Paste the transaction hex',
      '5. Review the transaction details carefully',
      '6. Sign the transaction with your private key',
      '7. Broadcast the signed transaction to the Bitcoin network',
      '8. Wait for confirmation (usually 1-6 blocks)',
      '9. Monitor the HTLC address for the secret reveal'
    ];
  }

  /**
   * Generate warnings
   */
  private generateWarnings(params: HTLCTransactionParams): string[] {
    return [
      '⚠️ Double-check the HTLC address before sending funds',
      '⚠️ Ensure you have the correct secret for claiming',
      '⚠️ The time lock is ${params.lockTime} blocks - plan accordingly',
      '⚠️ Keep your private keys secure - never share them',
      '⚠️ Test with small amounts first on testnet',
      '⚠️ Monitor the transaction on a Bitcoin block explorer'
    ];
  }

  /**
   * Generate spending explanation
   */
  private generateSpendingExplanation(secret: string, recipientAddress: string): string {
    return `This transaction spends from the HTLC by revealing the secret.

Purpose: This transaction claims the locked Bitcoin by providing the correct secret that matches the hash used in the HTLC creation.

Key Details:
- Secret: ${secret}
- Recipient: ${recipientAddress}
- Action: Reveals the secret to unlock the HTLC funds

The secret is revealed in the witness data of this transaction, allowing anyone to see it and complete the cross-chain swap.`;
  }

  /**
   * Explain spending opcodes
   */
  private explainSpendingOpcodes(secret: string): OpcodeExplanation[] {
    return [
      {
        opcode: 'OP_0',
        name: 'Push Empty',
        description: 'Pushes an empty byte array onto the stack',
        purpose: 'Required for witness version 0 (SegWit)',
        example: 'OP_0 -> []'
      },
      {
        opcode: 'OP_PUSH',
        name: 'Push Data',
        description: 'Pushes the secret data onto the stack',
        purpose: 'Provides the secret for HTLC verification',
        example: `OP_PUSH [${secret}]`
      },
      {
        opcode: 'OP_PUSH',
        name: 'Push Script',
        description: 'Pushes the HTLC script onto the stack',
        purpose: 'Provides the HTLC script for verification',
        example: 'OP_PUSH [htlc_script]'
      }
    ];
  }

  /**
   * Generate spending instructions
   */
  private generateSpendingInstructions(): string[] {
    return [
      '1. This transaction reveals the secret - use it carefully',
      '2. Copy the raw transaction hex below',
      '3. Sign with the HTLC recipient private key',
      '4. Broadcast to complete the cross-chain swap',
      '5. The secret will be visible on the blockchain',
      '6. Monitor for the corresponding ERC20 token release'
    ];
  }

  /**
   * Generate spending warnings
   */
  private generateSpendingWarnings(): string[] {
    return [
      '⚠️ This transaction reveals the secret publicly',
      '⚠️ Only use this when you want to complete the swap',
      '⚠️ The secret cannot be reused for other HTLCs',
      '⚠️ Ensure the ERC20 side is ready before revealing'
    ];
  }

  /**
   * Generate script pub key for address
   */
  private generateScriptPubKey(address: string): string {
    // Simplified - in production, use proper address encoding
    if (address.startsWith('bc1')) {
      return '0014' + 'HASH160_OF_PUBKEY'; // P2WPKH
    } else if (address.startsWith('3')) {
      return 'a914' + 'HASH160_OF_SCRIPT' + '87'; // P2SH
    } else {
      return '76a914' + 'HASH160_OF_PUBKEY' + '88ac'; // P2PKH
    }
  }

  /**
   * Reverse hex string (little-endian to big-endian)
   */
  private reverseHex(hex: string): string {
    const bytes = hex.match(/.{1,2}/g) || [];
    return bytes.reverse().join('');
  }
} 