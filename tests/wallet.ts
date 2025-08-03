import { TronWeb } from 'tronweb'
import * as Sdk from '@1inch/cross-chain-sdk'
import ERC20 from '../dist/contracts/IERC20.sol/IERC20.json'

export class Wallet {
    public tronWeb: InstanceType<typeof TronWeb>
    public address: string

    constructor(privateKeyOrAddress: string, tronWebInstance: InstanceType<typeof TronWeb>) {
        if (privateKeyOrAddress.startsWith('0x') && privateKeyOrAddress.length === 66) {
            // It's a private key
            this.tronWeb = new TronWeb({
                fullHost: tronWebInstance.fullHost,
                privateKey: privateKeyOrAddress
            })
            this.address = this.tronWeb.address.fromPrivateKey(privateKeyOrAddress)
        } else {
            // It's an address
            this.tronWeb = tronWebInstance
            this.address = privateKeyOrAddress
        }
    }

    public static async fromAddress(address: string, tronWebInstance: InstanceType<typeof TronWeb>): Promise<Wallet> {
        // In TronWeb, there's no direct equivalent to impersonateAccount
        // This would need to be handled differently in a test environment
        // For now, we'll just create a wallet with the address
        return new Wallet(address, tronWebInstance)
    }

    async tokenBalance(token: string): Promise<bigint> {
        const tokenContract = this.tronWeb.contract(ERC20.abi, token)
        const result = await tokenContract.balanceOf(this.address).call()
        return BigInt(result.toString())
    }

    async topUpFromDonor(token: string, donor: string, amount: bigint): Promise<void> {
        const donorWallet = await Wallet.fromAddress(donor, this.tronWeb)
        await donorWallet.transferToken(token, this.address, amount)
    }

    public async getAddress(): Promise<string> {
        return this.address
    }

    public async unlimitedApprove(tokenAddress: string, spender: string): Promise<void> {
        const currentApprove = await this.getAllowance(tokenAddress, spender)

        // for usdt like tokens
        if (currentApprove !== 0n) {
            await this.approveToken(tokenAddress, spender, 0n)
        }

        await this.approveToken(tokenAddress, spender, (1n << 256n) - 1n)
    }

    public async getAllowance(token: string, spender: string): Promise<bigint> {
        const contract = this.tronWeb.contract(ERC20.abi, token)
        const result = await contract.allowance(this.address, spender).call()
        return BigInt(result.toString())
    }

    public async transfer(dest: string, amount: bigint): Promise<void> {
        await this.tronWeb.trx.sendTransaction(dest, Number(amount))
    }

    public async transferToken(token: string, dest: string, amount: bigint): Promise<void> {
        const contract = this.tronWeb.contract(ERC20.abi, token)
        await contract.transfer(dest, amount.toString()).send()
    }

    public async approveToken(token: string, spender: string, amount: bigint): Promise<void> {
        const contract = this.tronWeb.contract(ERC20.abi, token)
        await contract.approve(spender, amount.toString()).send()
    }

    public async signOrder(srcChainId: number, order: Sdk.CrossChainOrder): Promise<string> {
        const typedData = order.getTypedData(srcChainId)

        // TronWeb doesn't have native EIP-712 signing, so we need to implement it
        // This is a simplified implementation - you may need to use a library for proper EIP-712 signing
        const message = JSON.stringify(typedData.message)
        return this.tronWeb.trx.sign(message)
    }

    async send(param: any): Promise<{ txHash: string; blockTimestamp: bigint; blockHash: string }> {
        const txParams = {
            to: param.to,
            data: param.data,
            value: param.value ? Number(param.value) : 0
        }

        const result = await this.tronWeb.trx.sendRawTransaction(txParams)

        if (result.result) {
            // Get transaction info
            const txInfo = await this.tronWeb.trx.getTransactionInfo(result.txid)
            const block = await this.tronWeb.trx.getBlock(txInfo.blockNumber)

            return {
                txHash: result.txid,
                blockTimestamp: BigInt(block.block_header.raw_data.timestamp),
                blockHash: block.blockID
            }
        }

        throw new Error(result.error || 'Transaction failed')
    }

    // Add missing methods that are being called in the test code
    public static fromSdk(sdk: any): Wallet {
        // Implementation for creating wallet from SDK
        throw new Error('fromSdk not implemented')
    }

    public getSdk(): any {
        // Implementation for getting SDK from wallet
        throw new Error('getSdk not implemented')
    }
}
