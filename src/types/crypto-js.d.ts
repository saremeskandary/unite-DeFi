declare module 'crypto-js' {
  interface WordArray {
    words: number[];
    sigBytes: number;
    toString(encoder?: Encoder): string;
    concat(wordArray: WordArray): WordArray;
    clone(): WordArray;
  }

  interface Cipher {
    encrypt(message: string | WordArray, key: string | WordArray, cfg?: CipherCfg): CipherParams;
    decrypt(ciphertext: string | CipherParams, key: string | WordArray, cfg?: CipherCfg): WordArray;
  }

  interface CipherParams {
    ciphertext: WordArray;
    key?: WordArray;
    iv?: WordArray;
    salt?: WordArray;
    algorithm?: object;
    mode?: object;
    padding?: object;
    blockSize?: number;
    formatter?: Formatter;
    toString(formatter?: Formatter): string;
  }

  interface Hasher {
    update(messageUpdate: string | WordArray): Hasher;
    finalize(messageUpdate?: string | WordArray): WordArray;
    reset(): Hasher;
    clone(): Hasher;
    toString(): string;
  }

  type HmacHasher = Hasher;

  interface Encoder {
    stringify(wordArray: WordArray): string;
    parse(str: string): WordArray;
  }

  interface Formatter {
    stringify(cipherParams: CipherParams): string;
    parse(str: string): CipherParams;
  }

  interface CipherCfg {
    iv?: WordArray;
    mode?: object;
    padding?: object;
    [key: string]: unknown;
  }

  // Hash functions
  function MD5(message?: string | WordArray): WordArray;
  function SHA1(message?: string | WordArray): WordArray;
  function SHA256(message?: string | WordArray): WordArray;
  function SHA224(message?: string | WordArray): WordArray;
  function SHA512(message?: string | WordArray): WordArray;
  function SHA384(message?: string | WordArray): WordArray;
  function SHA3(message?: string | WordArray, cfg?: { outputLength?: number }): WordArray;
  function RIPEMD160(message?: string | WordArray): WordArray;

  // HMAC
  function HmacMD5(message: string | WordArray, key: string | WordArray): WordArray;
  function HmacSHA1(message: string | WordArray, key: string | WordArray): WordArray;
  function HmacSHA256(message: string | WordArray, key: string | WordArray): WordArray;
  function HmacSHA224(message: string | WordArray, key: string | WordArray): WordArray;
  function HmacSHA512(message: string | WordArray, key: string | WordArray): WordArray;
  function HmacSHA384(message: string | WordArray, key: string | WordArray): WordArray;
  function HmacSHA3(message: string | WordArray, key: string | WordArray, cfg?: { outputLength?: number }): WordArray;
  function HmacRIPEMD160(message: string | WordArray, key: string | WordArray): WordArray;

  // KDF
  function PBKDF2(password: string | WordArray, salt: string | WordArray, cfg?: Record<string, unknown>): WordArray;
  function EvpKDF(password: string | WordArray, salt: string | WordArray, cfg?: Record<string, unknown>): WordArray;

  // Cipher algorithms
  const AES: Cipher;
  const DES: Cipher;
  const TripleDES: Cipher;
  const RC4: Cipher;
  const RC4Drop: Cipher;
  const Rabbit: Cipher;
  const RabbitLegacy: Cipher;
  const Blowfish: Cipher;

  namespace enc {
    const Hex: Encoder;
    const Latin1: Encoder;
    const Utf8: Encoder;
    const Base64: Encoder;
    const Base64url: Encoder;
  }

  namespace format {
    const OpenSSL: Formatter;
    const Hex: Formatter;
  }

  namespace mode {
    const CBC: object;
    const CFB: object;
    const CTR: object;
    const CTRGladman: object;
    const OFB: object;
    const ECB: object;
  }

  namespace pad {
    const Pkcs7: object;
    const Iso97971: object;
    const AnsiX923: object;
    const Iso10126: object;
    const ZeroPadding: object;
    const NoPadding: object;
  }

  namespace lib {
    const WordArray: {
      new(words?: number[], sigBytes?: number): WordArray;
      random(nBytes: number): WordArray;
    };
    const CipherParams: {
      new(cipherParams?: Partial<CipherParams>): CipherParams;
    };
    const Base: object;
    const BufferedBlockAlgorithm: object;
    const Hasher: object;
    const Cipher: object;
    const StreamCipher: object;
    const BlockCipher: object;
    const BlockCipherMode: object;
    const BufferedBlockAlgorithmMode: object;
  }

  namespace algo {
    const MD5: object;
    const SHA1: object;
    const SHA256: object;
    const SHA224: object;
    const SHA512: object;
    const SHA384: object;
    const SHA3: object;
    const RIPEMD160: object;
    const HMAC: object;
    const PBKDF2: object;
    const EvpKDF: object;
    const AES: object;
    const DES: object;
    const TripleDES: object;
    const RC4: object;
    const RC4Drop: object;
    const Rabbit: object;
    const RabbitLegacy: object;
    const Blowfish: object;
  }

  namespace x64 {
    const Word: {
      new(high: number, low: number): object;
    };
    const WordArray: {
      new(words?: object[], sigBytes?: number): object;
    };
  }

  namespace kdf {
    const OpenSSL: {
      execute(password: WordArray, keySize: number, ivSize: number, salt?: WordArray): CipherParams;
    };
  }
}
