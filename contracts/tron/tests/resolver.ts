import { TronWeb } from 'tronweb'
import * as Sdk from '@1inch/cross-chain-sdk'
import Contract from '../dist/contracts/Resolver.sol/Resolver.json'

export class Resolver {
    private readonly tronWeb: InstanceType<typeof TronWeb>
    public readonly dstSdk: { Address: string }

    constructor(
        public readonly srcAddress: string,
        public readonly dstAddress: string,
        tronWebInstance?: InstanceType<typeof TronWeb>
    ) {
        // If no TronWeb instance provided, create a default one
        this.tronWeb = tronWebInstance || new TronWeb({
            fullHost: process.env.DST_CHAIN_RPC || 'https://nile.trongrid.io' // Nile testnet by default
        })
        // Set up dstSdk with the destination address
        this.dstSdk = {
            Address: this.dstAddress
        }
    }

    public deploySrc(
        chainId: number,
        order: Sdk.CrossChainOrder,
        signature: string,
        takerTraits: Sdk.TakerTraits,
        amount: bigint,
        hashLock = order.escrowExtension.hashLockInfo
    ): any {
        // Parse signature - TronWeb uses different signature format
        const sig = signature.startsWith('0x') ? signature.slice(2) : signature
        const r = '0x' + sig.slice(0, 64)
        const s = '0x' + sig.slice(64, 128)
        const v = parseInt(sig.slice(128, 130), 16)

        const { args, trait } = takerTraits.encode()
        const immutables = order.toSrcImmutables(chainId, new Sdk.Address(this.srcAddress), amount, hashLock)

        // Mock ABI encoding for testing - TronWeb doesn't have these methods
        // In production, you would need to implement proper ABI encoding
        const functionSelector = '0x12345678' // Mock function selector
        const parameters = '0x' + '0'.repeat(64) // Mock parameters

        return {
            to: this.srcAddress,
            data: functionSelector + parameters.slice(2),
            value: order.escrowExtension.srcSafetyDeposit
        }
    }

    public deployDst(
        /**
         * Sdk.Immutables from SrcEscrowCreated event with complement applied
         */
        immutables: Sdk.Immutables
    ): any {
        // Mock ABI encoding for testing
        const functionSelector = '0x87654321' // Mock function selector
        const parameters = '0x' + '0'.repeat(64) // Mock parameters

        return {
            to: this.dstAddress,
            data: functionSelector + parameters.slice(2),
            value: immutables.safetyDeposit
        }
    }

    public withdraw(
        side: 'src' | 'dst',
        escrow: Sdk.Address,
        secret: string,
        immutables: Sdk.Immutables
    ): any {
        // Mock ABI encoding for testing
        const functionSelector = '0xabcdef12' // Mock function selector
        const parameters = '0x' + '0'.repeat(64) // Mock parameters

        return {
            to: side === 'src' ? this.srcAddress : this.dstAddress,
            data: functionSelector + parameters.slice(2)
        }
    }

    public cancel(side: 'src' | 'dst', escrow: Sdk.Address, immutables: Sdk.Immutables): any {
        // Mock ABI encoding for testing
        const functionSelector = '0xdeadbeef' // Mock function selector
        const parameters = '0x' + '0'.repeat(64) // Mock parameters

        return {
            to: side === 'src' ? this.srcAddress : this.dstAddress,
            data: functionSelector + parameters.slice(2)
        }
    }
}
