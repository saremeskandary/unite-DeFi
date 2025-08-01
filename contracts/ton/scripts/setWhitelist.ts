import { Address, toNano } from '@ton/core';
import { TonFusion } from '../build/TonFusion/TonFusion_TonFusion';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();

    const contractAddress = Address.parse(args.length > 0 ? args[0] : await ui.input('TonFusion contract address'));
    const resolverAddress = Address.parse(args.length > 1 ? args[1] : await ui.input('Resolver address to whitelist'));
    const whitelistStatus = args.length > 2 ? args[2] === 'true' : await ui.input('Whitelist status (true/false)') === 'true';

    if (!(await provider.isContractDeployed(contractAddress))) {
        ui.write(`Error: Contract at address ${contractAddress} is not deployed!`);
        return;
    }

    const tonFusion = provider.open(TonFusion.fromAddress(contractAddress));

    ui.write(`Setting whitelist status for ${resolverAddress} to ${whitelistStatus}...`);

    await tonFusion.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'SetWhiteList',
            resolver: resolverAddress,
            whitelistStatus: whitelistStatus,
        }
    );

    ui.write('Whitelist status updated successfully!');
    ui.write(`Resolver: ${resolverAddress}`);
    ui.write(`Status: ${whitelistStatus ? 'Whitelisted' : 'Not whitelisted'}`);
} 