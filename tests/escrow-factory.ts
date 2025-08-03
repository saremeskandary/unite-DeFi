import TronWeb from 'tronweb'
import Sdk from '@1inch/cross-chain-sdk'
import EscrowFactoryContract from '../dist/contracts/EscrowFactory.sol/EscrowFactory.json'

export class EscrowFactory {
    private contract: any

    constructor(
        private readonly tronWeb: TronWeb,
        private readonly address: string
    ) {
        this.contract = this.tronWeb.contract(EscrowFactoryContract.abi, address)
    }

    public async getSourceImpl(): Promise<Sdk.Address> {
        const result = await this.contract.ESCROW_SRC_IMPLEMENTATION().call()
        return Sdk.Address.fromBigInt(BigInt(result))
    }

    public async getDestinationImpl(): Promise<Sdk.Address> {
        const result = await this.contract.ESCROW_DST_IMPLEMENTATION().call()
        return Sdk.Address.fromBigInt(BigInt(result))
    }

    public async getSrcDeployEvent(blockHash: string): Promise<[Sdk.Immutables, Sdk.DstImmutablesComplement]> {
        // Get the block to fetch transactions and events
        const block = await this.tronWeb.trx.getBlock(blockHash)

        // Find the SrcEscrowCreated event in block transactions
        let eventData = null
        for (const tx of block.transactions || []) {
            if (tx.raw_data.contract[0].parameter.value.contract_address === this.tronWeb.address.toHex(this.address)) {
                // Get transaction info to access events
                const txInfo = await this.tronWeb.trx.getTransactionInfo(tx.txID)
                if (txInfo.log) {
                    for (const log of txInfo.log) {
                        // Check if this is the SrcEscrowCreated event
                        const eventSignature = this.tronWeb.sha3('SrcEscrowCreated(tuple,tuple)')
                        if (log.topics[0] === eventSignature) {
                            // Decode the event data
                            const decoded = this.tronWeb.utils.abi.decodeParameters([
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
            Sdk.DstImmutablesComplement.new({
                maker: Sdk.Address.fromBigInt(BigInt(this.tronWeb.address.toHex(complement[0]))),
                amount: BigInt(complement[1]),
                token: Sdk.Address.fromBigInt(BigInt(this.tronWeb.address.toHex(complement[2]))),
                safetyDeposit: BigInt(complement[3])
            })
        ]
    }
}
