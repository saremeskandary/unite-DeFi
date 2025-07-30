import * as bitcoin from 'bitcoinjs-lib'

export interface HtlcScriptParams {
  secretHash: string
  locktime: number
  senderPubKey: string
  receiverPubKey: string
  network: bitcoin.Network
  addressType?: 'p2sh' | 'p2wsh'
}

export interface HtlcScript {
  script: Buffer
  address: string
}

export interface ValidateHtlcScriptParams {
  script: Buffer
  secret?: string
  pubKey: string
  path: 'redeem' | 'refund'
  currentTime?: number
}

export function createHtlcScript(params: HtlcScriptParams): HtlcScript {
  const { secretHash, locktime, senderPubKey, receiverPubKey, network, addressType = 'p2sh' } = params;

  // Convert hex strings to buffers
  const secretHashBuffer = Buffer.from(secretHash, 'hex');
  const senderPubKeyBuffer = Buffer.from(senderPubKey, 'hex');
  const receiverPubKeyBuffer = Buffer.from(receiverPubKey, 'hex');

  // Create the HTLC script
  // Format: OP_IF <receiver_pubkey> OP_CHECKSIGVERIFY OP_SHA256 <secret_hash> OP_EQUAL OP_ELSE <locktime> OP_CHECKLOCKTIMEVERIFY OP_DROP <sender_pubkey> OP_CHECKSIG OP_ENDIF
  const script = bitcoin.script.compile([
    bitcoin.opcodes.OP_IF,                    // 63 - Start redeem path
    receiverPubKeyBuffer,                     // Receiver's public key
    bitcoin.opcodes.OP_CHECKSIGVERIFY,        // ac - Verify signature
    bitcoin.opcodes.OP_SHA256,                // a8 - Hash the secret
    secretHashBuffer,                         // Expected secret hash
    bitcoin.opcodes.OP_EQUAL,                 // 87 - Verify hash matches
    bitcoin.opcodes.OP_ELSE,                  // 67 - Start refund path
    bitcoin.script.number.encode(locktime),   // Locktime value
    bitcoin.opcodes.OP_CHECKLOCKTIMEVERIFY,   // b1 - Verify locktime has passed
    bitcoin.opcodes.OP_DROP,                  // 75 - Drop locktime from stack
    senderPubKeyBuffer,                       // Sender's public key
    bitcoin.opcodes.OP_CHECKSIG,              // ac - Verify signature
    bitcoin.opcodes.OP_ENDIF                  // 68 - End conditional
  ]);

  // Generate address based on address type
  let address: string;
  if (addressType === 'p2wsh') {
    // P2WSH (Pay to Witness Script Hash) - bech32 format
    const scriptHash = bitcoin.crypto.sha256(script);
    address = bitcoin.address.toBech32(scriptHash, 0, network.bech32);
  } else {
    // P2SH (Pay to Script Hash) - legacy format
    const scriptHash = bitcoin.crypto.hash160(script);
    address = bitcoin.address.toBase58Check(scriptHash, network.scriptHash);
  }

  return { script, address };
}

export function validateHtlcScript(params: ValidateHtlcScriptParams): boolean {
  const { script, secret, pubKey, path, currentTime = Math.floor(Date.now() / 1000) } = params;

  try {
    // Parse the script to extract components
    const scriptChunks = bitcoin.script.decompile(script);
    if (!scriptChunks || scriptChunks.length < 13) {
      return false;
    }

    // Expected script structure:
    // [OP_IF, receiver_pubkey, OP_CHECKSIGVERIFY, OP_SHA256, secret_hash, OP_EQUAL, OP_ELSE, locktime, OP_CHECKLOCKTIMEVERIFY, OP_DROP, sender_pubkey, OP_CHECKSIG, OP_ENDIF]

    if (path === 'redeem') {
      // Validate redeem path
      if (!secret) {
        return false;
      }

      // Check if script has the correct structure for redeem path
      if (scriptChunks[0] !== bitcoin.opcodes.OP_IF) {
        return false;
      }

      // Verify the secret hash matches
      const secretHash = bitcoin.crypto.sha256(Buffer.from(secret, 'hex'));
      const expectedSecretHash = scriptChunks[4];

      if (!Buffer.isBuffer(expectedSecretHash) || !secretHash.equals(expectedSecretHash)) {
        return false;
      }

      // Verify the public key matches
      const expectedPubKey = scriptChunks[1];
      const providedPubKey = Buffer.from(pubKey, 'hex');

      if (!Buffer.isBuffer(expectedPubKey) || !providedPubKey.equals(expectedPubKey)) {
        return false;
      }

      return true;

    } else if (path === 'refund') {
      // Validate refund path
      if (scriptChunks[0] !== bitcoin.opcodes.OP_IF) {
        return false;
      }

      // Extract locktime from script
      const locktimeBuffer = scriptChunks[7];
      if (!Buffer.isBuffer(locktimeBuffer)) {
        return false;
      }

      const locktime = bitcoin.script.number.decode(locktimeBuffer);

      // Check if locktime has passed
      if (locktime > currentTime) {
        return false;
      }

      // Verify the public key matches (sender's pubkey for refund)
      const expectedPubKey = scriptChunks[10];
      const providedPubKey = Buffer.from(pubKey, 'hex');

      if (!Buffer.isBuffer(expectedPubKey) || !providedPubKey.equals(expectedPubKey)) {
        return false;
      }

      return true;
    }

    return false;
  } catch (error) {
    // If script parsing fails, return false
    return false;
  }
} 