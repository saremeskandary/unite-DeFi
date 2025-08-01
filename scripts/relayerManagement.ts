import { Address, toNano } from '@ton/core';
import { TonFusion } from '../build/TonFusion/TonFusion_TonFusion';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();

    const contractAddress = Address.parse(args.length > 0 ? args[0] : await ui.input('TonFusion contract address'));
    const action = args.length > 1 ? args[1] : await ui.input('Action (register/update/stats)');
    const relayerAddress = Address.parse(args.length > 2 ? args[2] : await ui.input('Relayer address'));
    const success = args.length > 3 ? args[3] === 'true' : await ui.input('Success (true/false)') === 'true';

    if (!(await provider.isContractDeployed(contractAddress))) {
        ui.write(`Error: Contract at address ${contractAddress} is not deployed!`);
        return;
    }

    const tonFusion = provider.open(TonFusion.fromAddress(contractAddress));

    if (action === 'register') {
        // Register new relayer
        ui.write(`Registering relayer...`);
        ui.write(`Relayer: ${relayerAddress}`);

        await tonFusion.send(
            provider.sender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'RegisterRelayer' as const,
                relayer: relayerAddress,
                customPayload: null,
            }
        );

        ui.write('Relayer registered successfully!');
        ui.write(`Relayer: ${relayerAddress}`);
    } else if (action === 'update') {
        // Update relayer stats
        ui.write(`Updating relayer stats...`);
        ui.write(`Relayer: ${relayerAddress}`);
        ui.write(`Success: ${success}`);

        await tonFusion.send(
            provider.sender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'UpdateRelayerStats' as const,
                relayer: relayerAddress,
                success: success,
                customPayload: null,
            }
        );

        ui.write('Relayer stats updated successfully!');
        ui.write(`Relayer: ${relayerAddress}`);
        ui.write(`Success: ${success}`);
    } else if (action === 'stats') {
        // View relayer statistics
        ui.write('=== Relayer Statistics ===');
        
        const contractData = await tonFusion.getGetData();
        
        ui.write(`Total Orders: ${contractData.totalOrders}`);
        ui.write(`Total Volume: ${contractData.totalVolume}`);
        ui.write(`Total Resolves: ${contractData.totalResolves}`);
        
        ui.write('\n=== Relayer Management ===');
        ui.write('Register: npm run bp run relayerManagement <contract> register <address>');
        ui.write('Update Stats: npm run bp run relayerManagement <contract> update <address> <true/false>');
        ui.write('View Stats: npm run bp run relayerManagement <contract> stats');
        
        ui.write('\n=== Relayer Best Practices ===');
        ui.write('1. Monitor order books across chains');
        ui.write('2. Execute partial fills efficiently');
        ui.write('3. Maintain high success rates');
        ui.write('4. Use multiple secrets for large orders');
        ui.write('5. Monitor timelocks and expiration');
    } else {
        ui.write('Error: Invalid action. Use "register", "update", or "stats"');
        return;
    }
} 