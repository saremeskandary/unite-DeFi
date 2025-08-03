import { Address, toNano } from '@ton/core';
import { TonFusion } from '../build/TonFusion/TonFusion_TonFusion';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();

    const contractAddress = Address.parse(args.length > 0 ? args[0] : await ui.input('TonFusion contract address'));
    const action = args.length > 1 ? args[1] : await ui.input('Action (fill/complete)');
    const orderHash = BigInt(args.length > 2 ? args[2] : await ui.input('Order hash'));
    const secret = BigInt(args.length > 3 ? args[3] : await ui.input('Secret'));
    const fillAmount = args.length > 4 ? toNano(args[4]) : toNano(await ui.input('Fill amount (in TON)'));
    const resolver = Address.parse(args.length > 5 ? args[5] : await ui.input('Resolver address'));

    if (!(await provider.isContractDeployed(contractAddress))) {
        ui.write(`Error: Contract at address ${contractAddress} is not deployed!`);
        return;
    }

    const tonFusion = provider.open(TonFusion.fromAddress(contractAddress));

    if (action === 'fill') {
        // Create partial fill
        ui.write(`Creating partial fill...`);
        ui.write(`Order Hash: ${orderHash}`);
        ui.write(`Secret: ${secret}`);
        ui.write(`Fill Amount: ${fillAmount}`);
        ui.write(`Resolver: ${resolver}`);

        await tonFusion.send(
            provider.sender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'PartialFill' as const,
                orderHash: orderHash,
                secret: secret,
                fillAmount: fillAmount,
                resolver: resolver,
                customPayload: null,
            }
        );

        ui.write('Partial fill created successfully!');
        ui.write(`Order Hash: ${orderHash}`);
        ui.write(`Fill Amount: ${fillAmount}`);
    } else if (action === 'complete') {
        // Complete partial fill
        ui.write(`Completing partial fill...`);
        ui.write(`Order Hash: ${orderHash}`);
        ui.write(`Secret: ${secret}`);

        await tonFusion.send(
            provider.sender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'CompletePartialFill' as const,
                orderHash: orderHash,
                secret: secret,
            }
        );

        ui.write('Partial fill completed successfully!');
        ui.write(`Order Hash: ${orderHash}`);
        ui.write(`Secret: ${secret}`);
    } else {
        ui.write('Error: Invalid action. Use "fill" or "complete"');
        return;
    }
} 