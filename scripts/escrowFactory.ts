import { Address, toNano } from '@ton/core';
import { TonFusion } from '../build/TonFusion/TonFusion_TonFusion';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();

    const contractAddress = Address.parse(args.length > 0 ? args[0] : await ui.input('TonFusion contract address'));
    const action = args.length > 1 ? args[1] : await ui.input('Action (deploy/list)');
    const chainId = parseInt(args.length > 2 ? args[2] : await ui.input('Chain ID'));
    const targetAddress = Address.parse(args.length > 3 ? args[3] : await ui.input('Target contract address'));

    if (!(await provider.isContractDeployed(contractAddress))) {
        ui.write(`Error: Contract at address ${contractAddress} is not deployed!`);
        return;
    }

    const tonFusion = provider.open(TonFusion.fromAddress(contractAddress));

    if (action === 'deploy') {
        // Deploy escrow contract
        ui.write(`Deploying escrow contract...`);
        ui.write(`Chain ID: ${chainId}`);
        ui.write(`Target Address: ${targetAddress}`);

        await tonFusion.send(
            provider.sender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'DeployEscrow' as const,
                chainId: chainId,
                targetAddress: targetAddress,
                customPayload: null,
            }
        );

        ui.write('Escrow deployment initiated!');
        ui.write(`Chain ID: ${chainId}`);
        ui.write(`Target Address: ${targetAddress}`);
    } else if (action === 'list') {
        // List deployed escrow contracts
        ui.write('=== Deployed Escrow Contracts ===');
        
        const contractData = await tonFusion.getGetData();
        
        ui.write(`Total Orders: ${contractData.totalOrders}`);
        ui.write(`Total Volume: ${contractData.totalVolume}`);
        ui.write(`Total Resolves: ${contractData.totalResolves}`);
        
        ui.write('\n=== Supported Chains ===');
        ui.write('1 = Ethereum Mainnet');
        ui.write('137 = Polygon');
        ui.write('56 = BSC');
        ui.write('8453 = Base');
        ui.write('42161 = Arbitrum');
        ui.write('-3 = TON Mainnet');
        ui.write('-239 = TON Testnet');
        
        ui.write('\n=== Usage Examples ===');
        ui.write('Deploy to Ethereum: npm run bp run escrowFactory <contract> deploy 1 <address>');
        ui.write('Deploy to Base: npm run bp run escrowFactory <contract> deploy 8453 <address>');
        ui.write('List contracts: npm run bp run escrowFactory <contract> list');
    } else {
        ui.write('Error: Invalid action. Use "deploy" or "list"');
        return;
    }
} 