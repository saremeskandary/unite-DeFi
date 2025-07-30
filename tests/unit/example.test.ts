import '@testing-library/jest-dom'

describe('Jest Setup', () => {
  it('should have testing library matchers available', () => {
    const element = document.createElement('div')
    element.textContent = 'Test content'
    document.body.appendChild(element)
    
    expect(element).toBeInTheDocument()
    expect(element).toHaveTextContent('Test content')
  })

  it('should have global test utilities available', () => {
    expect(global.testUtils).toBeDefined()
    expect(typeof global.testUtils.generateTestSecret).toBe('function')
    expect(typeof global.testUtils.generateTestAddress).toBe('function')
    expect(typeof global.testUtils.createECPair).toBe('function')
    expect(typeof global.testUtils.waitForConfirmation).toBe('function')
  })

  it('should generate test secrets', () => {
    const secret1 = global.testUtils.generateTestSecret()
    const secret2 = global.testUtils.generateTestSecret()
    
    expect(secret1).toBeDefined()
    expect(secret2).toBeDefined()
    expect(secret1).not.toBe(secret2)
    expect(secret1.length).toBe(64) // 32 bytes = 64 hex characters
  })

  it('should generate test Bitcoin addresses', () => {
    const address1 = global.testUtils.generateTestAddress()
    const address2 = global.testUtils.generateTestAddress()
    
    expect(address1).toBeDefined()
    expect(address2).toBeDefined()
    expect(address1).not.toBe(address2)
    expect(address1).toMatch(/^[2mn][1-9A-HJ-NP-Za-km-z]{25,34}$/) // P2SH format
  })

  it('should create ECPair instances', () => {
    const keyPair1 = global.testUtils.createECPair()
    const keyPair2 = global.testUtils.createECPair()
    
    expect(keyPair1).toBeDefined()
    expect(keyPair2).toBeDefined()
    expect(keyPair1.publicKey).toBeDefined()
    expect(keyPair2.publicKey).toBeDefined()
    expect(keyPair1.publicKey).not.toEqual(keyPair2.publicKey)
  })

  it('should have Bitcoin testnet environment configured', () => {
    expect(process.env.BITCOIN_NETWORK).toBe('testnet')
    expect(process.env.BITCOIN_RPC_URL).toBeDefined()
  })
}) 