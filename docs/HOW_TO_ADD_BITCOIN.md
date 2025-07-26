# How to Add Bitcoin Functionality to the Unite-DeFi Resolver

This guide outlines the technical steps required to integrate Bitcoin HTLC (Hashed Time-Lock Contract) functionality into the off-chain resolver service. The primary tool for this is the `bitcoinjs-lib` library, which allows for the creation and management of Bitcoin transactions in a Node.js environment.

---

## Prerequisites

Before you begin, ensure your resolver project has the necessary dependencies:

*   **Node.js**: The runtime environment for the resolver.
*   **`bitcoinjs-lib`**: The core library for Bitcoin scripting and transactions.
*   **`axios` or similar**: For interacting with a Bitcoin block explorer API (e.g., Blockstream's API for testnet).
*   A Bitcoin wallet for the resolver with some testnet BTC.

Install the required library:
```bash
npm install bitcoinjs-lib ecpair
```

---

## Step 1: Configure Bitcoin Network and Wallet

First, set up the Bitcoin network (we'll use testnet) and the resolver's wallet.

```typescript
import { networks, ECPair } from 'bitcoinjs-lib';

// 1. Define the network
const network = networks.testnet;

// 2. Load the resolver's wallet
// (Best practice: use a WIF - Wallet Import Format - string from environment variables)
const resolverPrivateKey = process.env.BITCOIN_PRIVATE_KEY_WIF;
if (!resolverPrivateKey) {
  throw new Error('Bitcoin private key is not set!');
}
const resolverKeyPair = ECPair.fromWIF(resolverPrivateKey, network);
const { address: resolverBtcAddress } = bitcoinjs.payments.p2pkh({ pubkey: resolverKeyPair.publicKey, network });

console.log(`Resolver BTC Address: ${resolverBtcAddress}`);
```

## Step 2: Create the HTLC Script

The core of the atomic swap is the HTLC script. This script defines the conditions for spending the locked BTC.

```typescript
import * as bitcoin from 'bitcoinjs-lib';
import * as ecc from 'tiny-secp256k1';

bitcoin.initEccLib(ecc);

function createHtlcScript(
  hash: Buffer,
  recipientPublicKey: Buffer,
  funderPublicKey: Buffer,
  lockTime: number
): Buffer {
  return bitcoin.script.compile([
    bitcoin.opcodes.OP_HASH160,
    hash, // The hash of the secret
    bitcoin.opcodes.OP_EQUALVERIFY,
    recipientPublicKey, // The user's public key
    bitcoin.opcodes.OP_CHECKSIG,
    bitcoin.opcodes.OP_ELSE,
    bitcoin.script.number.encode(lockTime), // The refund timelock
    bitcoin.opcodes.OP_CHECKLOCKTIMEVERIFY,
    bitcoin.opcodes.OP_DROP,
    funderPublicKey, // The resolver's public key (for refunds)
    bitcoin.opcodes.OP_CHECKSIG,
    bitcoin.opcodes.OP_ENDIF,
  ]);
}
```

## Step 3: Fund the HTLC

Next, create and broadcast a transaction that sends BTC to a P2SH (Pay-to-Script-Hash) address derived from the HTLC script.

```typescript
// 1. Generate the HTLC script from Step 2
const htlcScript = createHtlcScript(/* ...args... */);

// 2. Create the P2SH address
const p2sh = bitcoin.payments.p2sh({
  redeem: { output: htlcScript, network },
  network,
});
const htlcAddress = p2sh.address!;

console.log(`Send BTC to this HTLC address: ${htlcAddress}`);

// 3. Build the funding transaction
// This requires fetching UTXOs (Unspent Transaction Outputs) for the resolver's wallet
const utxos = await getUtxos(resolverBtcAddress); // You need to implement this function

const psbt = new bitcoin.Psbt({ network });
psbt.addInput({
  hash: utxos[0].txid,
  index: utxos[0].vout,
  // ... other input details
});
psbt.addOutput({
  address: htlcAddress,
  value: 10000, // Amount in satoshis to lock
});
// Add a change output back to the resolver if needed

psbt.signInput(0, resolverKeyPair);
psbt.finalizeAllInputs();

const tx = psbt.extractTransaction();
const txHex = tx.toHex();

// 4. Broadcast the transaction
// Use a block explorer's API to broadcast txHex
await broadcastTx(txHex);
console.log(`Transaction broadcasted! TXID: ${tx.getId()}`);
```

## Step 4: Monitor for the Secret

The resolver must monitor the Bitcoin blockchain to detect when the user spends the HTLC output. When they do, their transaction will contain the secret (`preimage`) in the script signature.

1.  **Watch the HTLC Address**: Periodically query a block explorer API for transactions involving the `htlcAddress`.
2.  **Find the Spending Transaction**: Look for a transaction that uses the UTXO from the funding transaction as an input.
3.  **Extract the Secret**: The `scriptSig` of the spending transaction's input will contain the secret. It will be the first data push in the script.

```typescript
// Pseudo-code for secret extraction
async function watchForSecret(htlcAddress: string): Promise<Buffer | null> {
  const history = await getAddressHistory(htlcAddress);
  const spendingTx = findSpendingTransaction(history);

  if (spendingTx) {
    // The secret is in the input's script witness
    const scriptWitness = spendingTx.ins[0].witness;
    if (scriptWitness && scriptWitness.length > 1) {
      // The preimage is typically the second-to-last item in the witness stack
      const preimage = scriptWitness[scriptWitness.length - 2];
      return preimage;
    }
  }
  return null;
}
```

Once the secret is extracted, the resolver can use it to complete the swap on the Ethereum side.

## Step 5: Handle Timelock Refunds

If the user never reveals the secret and the timelock expires, the resolver must reclaim its BTC.

1.  **Check the Timelock**: Ensure the `lockTime` (as a block height or timestamp) has passed.
2.  **Create a Refund Transaction**: Build a transaction that spends the HTLC output. The `scriptSig` will be different this time, satisfying the `OP_ELSE` part of the HTLC script.

```typescript
// Build the refund transaction
const refundPsbt = new bitcoin.Psbt({ network });
refundPsbt.setLocktime(lockTime); // Set the transaction's locktime
refundPsbt.addInput({
  hash: fundingTxId,
  index: 0, // The output index of the HTLC
  redeemScript: htlcScript,
  // ... other input details
});
refundPsbt.addOutput({
  address: resolverBtcAddress,
  value: 9900, // Amount minus transaction fees
});

refundPsbt.signInput(0, resolverKeyPair);
refundPsbt.finalizeAllInputs();

const refundTx = refundPsbt.extractTransaction();
const refundTxHex = refundTx.toHex();

// Broadcast the refund transaction
await broadcastTx(refundTxHex);
console.log(`BTC refunded! TXID: ${refundTx.getId()}`);
```
