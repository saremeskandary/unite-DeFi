import 'dotenv/config'
import { expect, jest } from '@jest/globals'
import * as Sdk from '@1inch/cross-chain-sdk'
import { TronWeb } from 'tronweb'

describe('Basic functionality tests', () => {
  test('should import SDK successfully', () => {
    expect(Sdk).toBeDefined()
    expect(Sdk.Address).toBeDefined()
    expect(Sdk.Immutables).toBeDefined()
    expect(Sdk.DstImmutablesComplement).toBeDefined()
  })

  test('should create TronWeb instance', () => {
    const tronWeb = new TronWeb({
      fullHost: 'https://nile.trongrid.io'
    })
    expect(tronWeb).toBeDefined()
  })

  test('should create SDK Address', () => {
    const address = Sdk.Address.fromBigInt(0n)
    expect(address).toBeDefined()
    // The SDK returns Ethereum format addresses, not Tron format
    expect(address.toString()).toBe('0x0000000000000000000000000000000000000000')
  })

  test('should create Immutables', () => {
    // Create proper time locks with valid values
    const timeLocks = Sdk.TimeLocks.new({
      srcWithdrawal: 1000n,
      srcPublicWithdrawal: 2000n,
      srcCancellation: 3000n,
      srcPublicCancellation: 4000n,
      dstWithdrawal: 1500n,
      dstPublicWithdrawal: 2500n,
      dstCancellation: 3500n
    })

    const immutables = Sdk.Immutables.new({
      orderHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      hashLock: Sdk.HashLock.fromString('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'),
      maker: Sdk.Address.fromBigInt(0n),
      taker: Sdk.Address.fromBigInt(0n),
      token: Sdk.Address.fromBigInt(0n),
      amount: 1000000n,
      safetyDeposit: 100000n,
      timeLocks: timeLocks
    })
    expect(immutables).toBeDefined()
  })

  test('should create DstImmutablesComplement', () => {
    const complement = Sdk.DstImmutablesComplement.new({
      maker: Sdk.Address.fromBigInt(0n),
      amount: 1000000n,
      token: Sdk.Address.fromBigInt(0n),
      safetyDeposit: 100000n
    })
    expect(complement).toBeDefined()
  })
}) 