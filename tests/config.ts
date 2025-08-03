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
            limitOrderProtocol: process.env.SRC_LIMIT_ORDER_PROTOCOL || '0x111111125421ca6dc452d289314280a0f8842a65',
            wrappedNative: process.env.SRC_WRAPPED_NATIVE || '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
            ownerPrivateKey: process.env.SRC_OWNER_PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
            tokens: {
                USDC: {
                    address: process.env.SRC_USDC_ADDRESS || '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                    donor: process.env.SRC_USDC_DONOR || '0xd54f23be482d9a58676590fca79c8e43087f92fb'
                }
            }
        },
        destination: {
            chainId: 137, // Polygon (using as test destination since Tron is not supported by SDK)
            url: fromEnv.DST_CHAIN_RPC,
            createFork: fromEnv.DST_CHAIN_CREATE_FORK,
            limitOrderProtocol: process.env.DST_LIMIT_ORDER_PROTOCOL || '0x111111125421ca6dc452d289314280a0f8842a65',
            wrappedNative: process.env.DST_WRAPPED_NATIVE || '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270', // WMATIC on Polygon
            ownerPrivateKey: fromEnv.TRON_WALLET_PK || process.env.DST_OWNER_PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
            tokens: {
                USDT: { // Using USDT as it's the primary stablecoin on Tron
                    address: process.env.DST_USDT_ADDRESS || '0xc2132d05d31c914a87c6611c10748aeb04b58e8f', // USDT on Polygon (lowercase for SDK compatibility)
                    donor: process.env.DST_USDT_DONOR || '0xd54f23be482d9a58676590fca79c8e43087f92fb' // Example donor address (lowercase)
                },
                USDC: { // Also add USDC for compatibility
                    address: process.env.DST_USDC_ADDRESS || '0x2791bca1f2de4661ed88a30c99a7a9449aa84174', // USDC on Polygon (lowercase for SDK compatibility)
                    donor: process.env.DST_USDC_DONOR || '0xd54f23be482d9a58676590fca79c8e43087f92fb' // Example donor address (lowercase)
                }
            }
        }
    }
} as const

export type ChainConfig = (typeof config.chain)['source' | 'destination']
