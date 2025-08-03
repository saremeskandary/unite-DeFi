import { z } from 'zod'
import * as Sdk from '@1inch/cross-chain-sdk'
import * as process from 'node:process'

const bool = z
    .string()
    .transform((v) => v.toLowerCase() === 'true')
    .pipe(z.boolean())

const ConfigSchema = z.object({
    SRC_CHAIN_RPC: z.string().url(),
    DST_CHAIN_RPC: z.string().url(),
    SRC_CHAIN_CREATE_FORK: bool.default('false'),
    DST_CHAIN_CREATE_FORK: bool.default('false'),
    TRON_WALLET_PK: z.string().optional()
})

const fromEnv = ConfigSchema.parse(process.env)

export const config = {
    chain: {
        source: {
            chainId: 1, // Ethereum mainnet
            url: fromEnv.SRC_CHAIN_RPC,
            createFork: fromEnv.SRC_CHAIN_CREATE_FORK,
            limitOrderProtocol: '0x111111125421ca6dc452d289314280a0f8842a65',
            wrappedNative: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
            ownerPrivateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
            tokens: {
                USDC: {
                    address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                    donor: '0xd54f23be482d9a58676590fca79c8e43087f92fb'
                }
            }
        },
        destination: {
            chainId: 137, // Polygon (using as test destination since Tron is not supported by SDK)
            url: fromEnv.DST_CHAIN_RPC,
            createFork: fromEnv.DST_CHAIN_CREATE_FORK,
            limitOrderProtocol: 'TEosHrPmqr9vbSgJZwMBo6YJ6uWNE5mjjz', // Example Tron address - needs to be updated with actual deployment
            wrappedNative: 'TNUC9Qb1rRpS5CbWLmNMxXBjyFoydXjWFR', // WTRX on Tron mainnet
            ownerPrivateKey: fromEnv.TRON_WALLET_PK || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
            tokens: {
                USDT: { // Using USDT as it's the primary stablecoin on Tron
                    address: '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT on Ethereum mainnet (lowercase for SDK compatibility)
                    donor: '0xd54f23be482d9a58676590fca79c8e43087f92fb' // Example donor address (lowercase)
                },
                USDC: { // Also add USDC for compatibility
                    address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC on Ethereum mainnet (lowercase for SDK compatibility)
                    donor: '0xd54f23be482d9a58676590fca79c8e43087f92fb' // Example donor address (lowercase)
                }
            }
        }
    }
} as const

export type ChainConfig = (typeof config.chain)['source' | 'destination']
