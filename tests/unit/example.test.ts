import * as bitcoin from "bitcoinjs-lib";

describe("Example Tests", () => {
  it("should have testing library matchers available", () => {
    expect(1 + 1).toBe(2);
    expect([1, 2, 3]).toContain(2);
    expect({ name: "test" }).toHaveProperty("name");
  });

  it("should have global test utilities available", () => {
    expect(global.testUtils).toBeDefined();
    expect(typeof global.testUtils.generateTestSecret).toBe("function");
    expect(typeof global.testUtils.generateTestBitcoinAddress).toBe("function");
  });

  it("should generate test secrets", () => {
    const secret = global.testUtils.generateTestSecret();
    expect(secret).toBeDefined();
    expect(typeof secret).toBe("string");
    expect(secret.length).toBeGreaterThan(32);
  });

  it("should generate test Bitcoin addresses", () => {
    const address = global.testUtils.generateTestBitcoinAddress();
    expect(address).toBeDefined();
    expect(typeof address).toBe("string");
    expect(address.length).toBeGreaterThan(20);
  });

  it("should create ECPair instances", () => {
    const ecpair = global.testUtils.createECPair();
    expect(ecpair).toBeDefined();
    expect(ecpair.publicKey).toBeDefined();
    expect(ecpair.privateKey).toBeDefined();
  });

  it("should have Bitcoin testnet environment configured", () => {
    expect(process.env.BITCOIN_NETWORK).toBe("testnet");
    expect(process.env.BITCOIN_RPC_URL).toBeDefined();
    expect(process.env.BITCOIN_RPC_USER).toBeDefined();
    expect(process.env.BITCOIN_RPC_PASS).toBeDefined();
  });
});
