import { Address, toNano } from '@ton/core';
import { TonFusion } from '../build/TonFusion/TonFusion_TonFusion';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();

    const contractAddress = Address.parse(args.length > 0 ? args[0] : await ui.input('TonFusion contract address'));
    const refundType = args.length > 1 ? args[1] : await ui.input('Refund type (escrow/order)');
    const hash = BigInt(args.length > 2 ? args[2] : await ui.input('Hash (order hashlock)'));

    if (!(await provider.isContractDeployed(contractAddress))) {
        ui.write(`Error: Contract at address ${contractAddress} is not deployed!`);
        return;
    }

    const tonFusion = provider.open(TonFusion.fromAddress(contractAddress));

    ui.write(`Processing ${refundType} refund...`);
    ui.write(`Hash: ${hash}`);

    if (refundType === 'escrow') {
        // Refund from escrowLock (cross-chain orders)
        await tonFusion.send(
            provider.sender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'Refund',
                hash: hash,
                customPayload: null,
            }
        );
    } else if (refundType === 'order') {
        // Refund from escrowOrder (same-chain orders)
        await tonFusion.send(
            provider.sender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'RefundOrder',
                hash: hash,
                customPayload: null,
            }
        );
    } else {
        ui.write('Error: Invalid refund type. Use "escrow" or "order"');
        return;
    }

    ui.write(`${refundType} refund transaction sent successfully!`);
    ui.write(`Hash: ${hash}`);
    ui.write('Check your wallet for the refunded funds.');
} 