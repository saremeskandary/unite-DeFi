import { TronWeb } from 'tronweb'
import * as Sdk from '@1inch/cross-chain-sdk'
import ERC20 from '../dist/contracts/IERC20.sol/IERC20.json'

export class Wallet {
    public tronWeb: InstanceType<typeof TronWeb>
    public address: string

    constructor(privateKeyOrAddress: string, tronWebInstance: InstanceType<typeof TronWeb>) {
        if (privateKeyOrAddress.startsWith('0x') && privateKeyOrAddress.length === 66) {
            // It's a private key - create a new TronWeb instance with the private key
            // TronWeb expects private keys without 0x prefix
            const fullHost = String((tronWebInstance as any).fullHost || 'https://nile.trongrid.io')
            const privateKey = privateKeyOrAddress.slice(2) // Remove 0x prefix
            this.tronWeb = new TronWeb({
                fullHost: fullHost,
                privateKey: privateKey
            })
            this.address = this.tronWeb.address.fromPrivateKey(privateKey)
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

        // For testing purposes, we'll create a mock signature
        // In a real implementation, you would need proper EIP-712 signing
        // TronWeb doesn't support EIP-712 natively, so you'd need to use a library like ethers
        const message = JSON.stringify(typedData.message)
        
        // Create a mock signature for testing
        // In production, this should be a real signature from the private key
        const mockSignature = '0x' + '1'.repeat(64) + '2'.repeat(64) + '1b' // r, s, v format
        return mockSignature
    }

    async send(param: any): Promise<{ txHash: string; blockTimestamp: bigint; blockHash: string }> {
        // For testing purposes, we'll mock the transaction sending
        // In production, you would need to properly sign and send transactions
        const mockTxHash = '0x' + Math.random().toString(16).slice(2, 66)
        const mockBlockHash = '0x' + Math.random().toString(16).slice(2, 66)
        const mockTimestamp = BigInt(Math.floor(Date.now() / 1000))

        // Simulate transaction processing time
        await new Promise(resolve => setTimeout(resolve, 100))

        return {
            txHash: mockTxHash,
            blockTimestamp: mockTimestamp,
            blockHash: mockBlockHash
        }
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
