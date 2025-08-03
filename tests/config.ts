import { z } from 'zod'
import Sdk from '@1inch/cross-chain-sdk'
import * as process from 'node:process'

const bool = z
    .string()
    .transform((v) => v.toLowerCase() === 'true')
    .pipe(z.boolean())

const ConfigSchema = z.object({
    SRC_CHAIN_RPC: z.string().url(),
    DST_CHAIN_RPC: z.string().url(),
    SRC_CHAIN_CREATE_FORK: bool.default('true'),
    DST_CHAIN_CREATE_FORK: bool.default('true')
})

const fromEnv = ConfigSchema.parse(process.env)

export const config = {
    chain: {
        source: {
            chainId: Sdk.NetworkEnum.ETHEREUM,
            url: fromEnv.SRC_CHAIN_RPC,
            createFork: fromEnv.SRC_CHAIN_CREATE_FORK,
            limitOrderProtocol: '0x111111125421ca6dc452d289314280a0f8842a65',
            wrappedNative: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
            ownerPrivateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
            tokens: {
                USDC: {
                    address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                    donor: '0xd54F23BE482D9A58676590fCa79c8E43087f92fB'
                }
            }
        },
        destination: {
            chainId: Sdk.NetworkEnum.TRON, // Tron network
            url: fromEnv.DST_CHAIN_RPC,
            createFork: fromEnv.DST_CHAIN_CREATE_FORK,
            limitOrderProtocol: 'TEosHrPmqr9vbSgJZwMBo6YJ6uWNE5mjjz', // Example Tron address - needs to be updated with actual deployment
            wrappedNative: 'TNUC9Qb1rRpS5CbWLmNMxXBjyFoydXjWFR', // WTRX on Tron mainnet
            ownerPrivateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
            tokens: {
                USDT: { // Using USDT as it's the primary stablecoin on Tron
                    address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', // USDT TRC20 on Tron mainnet
                    donor: 'TQxr64oLrXtCrP6xRd2g91GN9maNFVD5Dj' // Example donor address - needs to be updated with actual address with USDT balance
                },
                USDC: { // Also add USDC for compatibility
                    address: 'TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8', // USDC TRC20 on Tron mainnet
                    donor: 'TQxr64oLrXtCrP6xRd2g91GN9maNFVD5Dj' // Example donor address
                }
            }
        }
    }
} as const

export type ChainConfig = (typeof config.chain)['source' | 'destination']
