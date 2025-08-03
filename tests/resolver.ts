import TronWeb from 'tronweb'
import Sdk from '@1inch/cross-chain-sdk'
import Contract from '../dist/contracts/Resolver.sol/Resolver.json'

export class Resolver {
    private readonly tronWeb: TronWeb

    constructor(
        public readonly srcAddress: string,
        public readonly dstAddress: string,
        tronWebInstance?: TronWeb
    ) {
        // If no TronWeb instance provided, create a default one
        this.tronWeb = tronWebInstance || new TronWeb({
            fullHost: 'https://api.nileex.io' // Nile testnet by default
        })
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
        
        const {args, trait} = takerTraits.encode()
        const immutables = order.toSrcImmutables(chainId, new Sdk.Address(this.srcAddress), amount, hashLock)

        // Encode function call data using TronWeb
        const functionSelector = this.tronWeb.utils.abi.encodeFunctionSignature('deploySrc(tuple,tuple,bytes32,bytes32,uint256,uint256,bytes)')
        const parameters = this.tronWeb.utils.abi.encodeParameters([
            'tuple',
            'tuple', 
            'bytes32',
            'bytes32',
            'uint256',
            'uint256',
            'bytes'
        ], [
            immutables.build(),
            order.build(),
            r,
            s,
            amount.toString(),
            trait.toString(),
            args
        ])

        return {
            to: this.srcAddress,
            data: functionSelector + parameters.slice(2),
            value: order.escrowExtension.srcSafetyDeposit
        }
    }

    public deployDst(
        /**
         * Immutables from SrcEscrowCreated event with complement applied
         */
        immutables: Sdk.Immutables
    ): any {
        const functionSelector = this.tronWeb.utils.abi.encodeFunctionSignature('deployDst(tuple,uint256)')
        const parameters = this.tronWeb.utils.abi.encodeParameters([
            'tuple',
            'uint256'
        ], [
            immutables.build(),
            immutables.timeLocks.toSrcTimeLocks().privateCancellation.toString()
        ])

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
        const functionSelector = this.tronWeb.utils.abi.encodeFunctionSignature('withdraw(address,string,tuple)')
        const parameters = this.tronWeb.utils.abi.encodeParameters([
            'address',
            'string', 
            'tuple'
        ], [
            escrow.toString(),
            secret,
            immutables.build()
        ])

        return {
            to: side === 'src' ? this.srcAddress : this.dstAddress,
            data: functionSelector + parameters.slice(2)
        }
    }

    public cancel(side: 'src' | 'dst', escrow: Sdk.Address, immutables: Sdk.Immutables): any {
        const functionSelector = this.tronWeb.utils.abi.encodeFunctionSignature('cancel(address,tuple)')
        const parameters = this.tronWeb.utils.abi.encodeParameters([
            'address',
            'tuple'
        ], [
            escrow.toString(),
            immutables.build()
        ])

        return {
            to: side === 'src' ? this.srcAddress : this.dstAddress,
            data: functionSelector + parameters.slice(2)
        }
    }
}
