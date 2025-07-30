declare module 'tiny-secp256k1' {
  export function sign(hash: Buffer, privateKey: Buffer, entropy?: Buffer): Buffer;
  export function signWithEntropy(hash: Buffer, privateKey: Buffer, entropy: Buffer): Buffer;
  export function verify(hash: Buffer, signature: Buffer, publicKey: Buffer, strict?: boolean): boolean;
  export function isPrivate(privateKey: Buffer): boolean;
  export function isXOnlyPoint(pubkey: Buffer): boolean;
  export function xOnlyPointAddTweak(pubkey: Buffer, tweak: Buffer): { parity: 0 | 1; xOnlyPubkey: Buffer } | null;
  export function privateAdd(privateKey: Buffer, tweak: Buffer): Buffer | null;
  export function privateSub(privateKey: Buffer, tweak: Buffer): Buffer | null;
  export function privateNegate(privateKey: Buffer): Buffer;
  export function pointFromScalar(privateKey: Buffer, compressed?: boolean): Buffer | null;
  export function pointCompress(pubkey: Buffer, compressed?: boolean): Buffer;
  export function pointAdd(pubkey: Buffer, tweak: Buffer, compressed?: boolean): Buffer | null;
  export function pointAddScalar(pubkey: Buffer, tweak: Buffer, compressed?: boolean): Buffer | null;
  export function pointMultiply(a: Buffer, b: Buffer, compressed?: boolean): Buffer | null;
  export function isPoint(pubkey: Buffer): boolean;
  export function isPointCompressed(pubkey: Buffer): boolean;
  export function signSchnorr(hash: Buffer, privateKey: Buffer, entropy?: Buffer): Buffer;
  export function verifySchnorr(hash: Buffer, signature: Buffer, publicKey: Buffer): boolean;
} 