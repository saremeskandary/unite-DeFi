// Jest setup file to handle browser-specific globals for TronWeb

// Set up browser globals for TronWeb
if (typeof globalThis !== 'undefined') {
  globalThis.self = globalThis;
  globalThis.window = globalThis;
}

// Set up crypto for random number generation
const crypto = require('crypto');
if (!globalThis.crypto) {
  globalThis.crypto = crypto.webcrypto || {
    getRandomValues: (arr) => {
      const bytes = crypto.randomBytes(arr.length);
      for (let i = 0; i < arr.length; i++) {
        arr[i] = bytes[i];
      }
      return arr;
    }
  };
}

// Mock WebAssembly if needed
if (!globalThis.WebAssembly) {
  globalThis.WebAssembly = {};
}

// Suppress console warnings during tests
const originalWarn = console.warn;
console.warn = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('ExperimentalWarning') || args[0].includes('deprecated'))
  ) {
    return;
  }
  originalWarn.apply(console, args);
};

// Add BigInt serialization support for Jest
if (typeof BigInt !== 'undefined') {
  BigInt.prototype.toJSON = function () {
    return this.toString();
  };
}