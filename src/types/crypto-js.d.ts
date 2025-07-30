declare module 'crypto-js' {
  // Core types
  interface WordArray {
    words: number[];
    sigBytes: number;
    toString(encoder?: any): string;
    concat(wordArray: WordArray): WordArray;
    clone(): WordArray;
  }

  interface Cipher {
    encrypt(message: string | WordArray, key: string | WordArray, cfg?: any): CipherParams;
    decrypt(ciphertext: string | CipherParams, key: string | WordArray, cfg?: any): WordArray;
  }

  interface CipherParams {
    ciphertext: WordArray;
    key?: WordArray;
    iv?: WordArray;
    salt?: WordArray;
    algorithm?: any;
    mode?: any;
    padding?: any;
    blockSize?: number;
    formatter?: any;
    toString(formatter?: any): string;
  }

  interface Hasher {
    update(messageUpdate: string | WordArray): Hasher;
    finalize(messageUpdate?: string | WordArray): WordArray;
    reset(): Hasher;
    clone(): Hasher;
    toString(): string;
  }

  interface HmacHasher {
    update(messageUpdate: string | WordArray): HmacHasher;
    finalize(messageUpdate?: string | WordArray): WordArray;
    reset(): HmacHasher;
    clone(): HmacHasher;
    toString(): string;
  }

  // Hash functions
  function MD5(message?: string | WordArray): WordArray;
  function SHA1(message?: string | WordArray): WordArray;
  function SHA256(message?: string | WordArray): WordArray;
  function SHA224(message?: string | WordArray): WordArray;
  function SHA512(message?: string | WordArray): WordArray;
  function SHA384(message?: string | WordArray): WordArray;
  function SHA3(message?: string | WordArray, cfg?: any): WordArray;
  function RIPEMD160(message?: string | WordArray): WordArray;

  // HMAC functions
  function HmacMD5(message: string | WordArray, key: string | WordArray): WordArray;
  function HmacSHA1(message: string | WordArray, key: string | WordArray): WordArray;
  function HmacSHA256(message: string | WordArray, key: string | WordArray): WordArray;
  function HmacSHA224(message: string | WordArray, key: string | WordArray): WordArray;
  function HmacSHA512(message: string | WordArray, key: string | WordArray): WordArray;
  function HmacSHA384(message: string | WordArray, key: string | WordArray): WordArray;
  function HmacSHA3(message: string | WordArray, key: string | WordArray, cfg?: any): WordArray;
  function HmacRIPEMD160(message: string | WordArray, key: string | WordArray): WordArray;

  // Key derivation functions
  function PBKDF2(password: string | WordArray, salt: string | WordArray, cfg?: any): WordArray;
  function EvpKDF(password: string | WordArray, salt: string | WordArray, cfg?: any): WordArray;

  // Cipher functions
  const AES: Cipher;
  const DES: Cipher;
  const TripleDES: Cipher;
  const RC4: Cipher;
  const RC4Drop: Cipher;
  const Rabbit: Cipher;
  const RabbitLegacy: Cipher;
  const Blowfish: Cipher;

  // Encoding
  namespace enc {
    const Hex: {
      stringify(wordArray: WordArray): string;
      parse(hexStr: string): WordArray;
    };
    const Latin1: {
      stringify(wordArray: WordArray): string;
      parse(latin1Str: string): WordArray;
    };
    const Utf8: {
      stringify(wordArray: WordArray): string;
      parse(utf8Str: string): WordArray;
    };
    const Base64: {
      stringify(wordArray: WordArray): string;
      parse(base64Str: string): WordArray;
    };
    const Base64url: {
      stringify(wordArray: WordArray): string;
      parse(base64urlStr: string): WordArray;
    };
  }

  // Format
  namespace format {
    const OpenSSL: {
      stringify(cipherParams: CipherParams): string;
      parse(openSSLStr: string): CipherParams;
    };
    const Hex: {
      stringify(cipherParams: CipherParams): string;
      parse(hexStr: string): CipherParams;
    };
  }

  // Mode
  namespace mode {
    const CBC: any;
    const CFB: any;
    const CTR: any;
    const CTRGladman: any;
    const OFB: any;
    const ECB: any;
  }

  // Padding
  namespace pad {
    const Pkcs7: any;
    const Iso97971: any;
    const AnsiX923: any;
    const Iso10126: any;
    const ZeroPadding: any;
    const NoPadding: any;
  }

  // Lib
  namespace lib {
    const WordArray: {
      new(words?: number[], sigBytes?: number): WordArray;
      random(nBytes: number): WordArray;
    };
    const CipherParams: {
      new(cipherParams?: any): CipherParams;
    };
    const Base: any;
    const BufferedBlockAlgorithm: any;
    const Hasher: any;
    const Cipher: any;
    const StreamCipher: any;
    const BlockCipher: any;
    const BlockCipherMode: any;
    const BufferedBlockAlgorithmMode: any;
  }

  // Algo
  namespace algo {
    const MD5: any;
    const SHA1: any;
    const SHA256: any;
    const SHA224: any;
    const SHA512: any;
    const SHA384: any;
    const SHA3: any;
    const RIPEMD160: any;
    const HMAC: any;
    const PBKDF2: any;
    const EvpKDF: any;
    const AES: any;
    const DES: any;
    const TripleDES: any;
    const RC4: any;
    const RC4Drop: any;
    const Rabbit: any;
    const RabbitLegacy: any;
    const Blowfish: any;
  }

  // X64
  namespace x64 {
    const Word: {
      new(high: number, low: number): any;
    };
    const WordArray: {
      new(words?: any[], sigBytes?: number): any;
    };
  }

  // KDF
  namespace kdf {
    const OpenSSL: any;
  }
} 