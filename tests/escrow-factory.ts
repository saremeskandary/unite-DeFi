import { TronWeb } from 'tronweb'
import * as Sdk from '@1inch/cross-chain-sdk'
import { DstImmutablesComplement } from '@1inch/cross-chain-sdk'
import EscrowFactoryContract from '../dist/contracts/EscrowFactory.sol/EscrowFactory.json'

export class EscrowFactory {
    private contract: any
    public readonly address: Sdk.Address

    constructor(
        private readonly tronWeb: InstanceType<typeof TronWeb>,
        addressString: string
    ) {
        this.contract = this.tronWeb.contract(EscrowFactoryContract.abi, addressString)
        this.address = Sdk.Address.fromBigInt(BigInt(this.tronWeb.address.toHex(addressString)))
    }

    public async getSourceImpl(): Promise<Sdk.Address> {
        const result = await this.contract.ESCROW_SRC_IMPLEMENTATION().call()
        return Sdk.Address.fromBigInt(BigInt(result))
    }

    public async getDestinationImpl(): Promise<Sdk.Address> {
        const result = await this.contract.ESCROW_DST_IMPLEMENTATION().call()
        return Sdk.Address.fromBigInt(BigInt(result))
    }

    public async getSrcDeployEvent(blockHash: string): Promise<[Sdk.Immutables, DstImmutablesComplement]> {
        // Get the block to fetch transactions and events
        const block = await this.tronWeb.trx.getBlock(blockHash)

        // Find the SrcEscrowCreated event in block transactions
        let eventData = null
        for (const tx of block.transactions || []) {
            // Check if this transaction is related to our contract
            const contractParam = tx.raw_data.contract[0].parameter.value
            if ('contract_address' in contractParam && contractParam.contract_address === this.tronWeb.address.toHex(this.address.toString())) {
                // Get transaction info to access events
                const txInfo = await this.tronWeb.trx.getTransactionInfo(tx.txID)
                if (txInfo.log) {
                    for (const log of txInfo.log) {
                        // Check if this is the SrcEscrowCreated event
                        const eventSignature = this.tronWeb.sha3('SrcEscrowCreated(tuple,tuple)')
                        if (log.topics[0] === eventSignature) {
                            // Decode the event data
                            const decoded = this.tronWeb.utils.abi.decodeParams([
                                'immutables',
                                'complement'
                            ], [
                                'tuple(bytes32,bytes32,address,address,address,uint256,uint256,uint256)',
                                'tuple(address,uint256,address,uint256)'
                            ], log.data)
                            eventData = decoded
                            break
                        }
                    }
                }
                if (eventData) break
            }
        }

        if (!eventData) {
            throw new Error('SrcEscrowCreated event not found in block')
        }

        const immutables = eventData[0]
        const complement = eventData[1]

        return [
            Sdk.Immutables.new({
                orderHash: immutables[0],
                hashLock: Sdk.HashLock.fromString(immutables[1]),
                maker: Sdk.Address.fromBigInt(BigInt(this.tronWeb.address.toHex(immutables[2]))),
                taker: Sdk.Address.fromBigInt(BigInt(this.tronWeb.address.toHex(immutables[3]))),
                token: Sdk.Address.fromBigInt(BigInt(this.tronWeb.address.toHex(immutables[4]))),
                amount: BigInt(immutables[5]),
                safetyDeposit: BigInt(immutables[6]),
                timeLocks: Sdk.TimeLocks.fromBigInt(BigInt(immutables[7]))
            }),
            DstImmutablesComplement.new({
                maker: Sdk.Address.fromBigInt(BigInt(this.tronWeb.address.toHex(complement[0]))),
                amount: BigInt(complement[1]),
                token: Sdk.Address.fromBigInt(BigInt(this.tronWeb.address.toHex(complement[2]))),
                safetyDeposit: BigInt(complement[3])
            })
        ]
    }

    // Add missing methods from SDK interface
    public getEscrowAddress(immutablesHash: string, implementationAddress: Sdk.Address): Sdk.Address {
        // Implementation for calculating escrow address
        // This would need to match the contract logic
        throw new Error('getEscrowAddress not implemented')
    }

    public getSrcEscrowAddress(srcImmutables: Sdk.Immutables, implementationAddress: Sdk.Address): Sdk.Address {
        // Implementation for calculating source escrow address
        throw new Error('getSrcEscrowAddress not implemented')
    }

    public getDstEscrowAddress(
        srcImmutables: Sdk.Immutables,
        complement: DstImmutablesComplement,
        blockTime: bigint,
        taker: Sdk.Address,
        implementationAddress: Sdk.Address
    ): Sdk.Address {
        // Implementation for calculating destination escrow address
        throw new Error('getDstEscrowAddress not implemented')
    }

    public getMultipleFillInteraction(proof: any[], idx: number, secretHash: string): Sdk.Interaction {
        // Implementation for multiple fill interaction
        throw new Error('getMultipleFillInteraction not implemented')
    }

    // Add methods that are being called in the test code
    public async getSrcEscrowSdk(immutables: Sdk.Immutables): Promise<any> {
        // Implementation for getting source escrow SDK
        throw new Error('getSrcEscrowSdk not implemented')
    }

    public async getDstEscrowSdk(immutables: Sdk.Immutables, complement: DstImmutablesComplement): Promise<any> {
        // Implementation for getting destination escrow SDK
        throw new Error('getDstEscrowSdk not implemented')
    }
}
