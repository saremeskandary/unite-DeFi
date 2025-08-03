import { Address } from '@ton/core';
import { TonFusion } from '../build/TonFusion/TonFusion_TonFusion';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();

    const contractAddress = Address.parse(args.length > 0 ? args[0] : await ui.input('TonFusion contract address'));

    if (!(await provider.isContractDeployed(contractAddress))) {
        ui.write(`Error: Contract at address ${contractAddress} is not deployed!`);
        return;
    }

    const tonFusion = provider.open(TonFusion.fromAddress(contractAddress));

    ui.write('=== TonFusion Enhanced Contract State ===');
    ui.write(`Contract Address: ${contractAddress}`);
    ui.write(`Owner: ${provider.sender().address?.toString()}`);

    // Contract data not available in this version
    ui.write('\n=== Contract Statistics ===');
    ui.write('Contract data not available in this version.');

    ui.write('\n=== Enhanced Features ===');
    ui.write('✅ Bi-directional swaps (TON ↔ EVM)');
    ui.write('✅ Partial fills with multiple secrets');
    ui.write('✅ Escrow factory for target chains');
    ui.write('✅ Relayer/Resolver system');
    ui.write('✅ HTLC with hashlock/timelock');
    ui.write('✅ Support for Base/Arbitrum/L2s');
    ui.write('✅ Smart contract level only (no REST APIs)');

    ui.write('\n=== Supported Networks ===');
    ui.write('1 = Ethereum Mainnet');
    ui.write('137 = Polygon');
    ui.write('56 = BSC');
    ui.write('8453 = Base');
    ui.write('42161 = Arbitrum');
    ui.write('-3 = TON Mainnet');
    ui.write('-239 = TON Testnet');

    ui.write('\n=== Usage Instructions ===');
    ui.write('1. Deploy: npm run bp run deployTonFusion');
    ui.write('2. Set Whitelist: npm run bp run setWhitelist <contract> <address> <true/false>');
    ui.write('3. Create Bi-directional Order: npm run bp run createBidirectionalOrder <contract> <direction> <fromChain> <toChain> <jetton> <sender> <receiver> <hashlock> <timelock> <amount>');
    ui.write('4. Partial Fill: npm run bp run partialFill <contract> <fill/complete> <orderHash> <secret> <amount> <resolver>');
    ui.write('5. Deploy Escrow: npm run bp run escrowFactory <contract> deploy <chainId> <address>');
    ui.write('6. Manage Relayers: npm run bp run relayerManagement <contract> <register/update/stats> <address>');
    ui.write('7. Get Fund: npm run bp run getFund <contract> <secret> <hash>');
    ui.write('8. Refund: npm run bp run refund <contract> <escrow/order> <hash>');
    ui.write('9. View Contract: npm run bp run viewContract <contract>');
    ui.write('10. Generate Secrets: npm run bp run generateSecret');

    ui.write('\n=== Example Commands ===');
    ui.write('Deploy: npm run bp run deployTonFusion');
    ui.write('TON → Ethereum: npm run bp run createBidirectionalOrder <contract> ton-to-evm 1 1 <jetton> <sender> <receiver> <hashlock> <timelock> <amount>');
    ui.write('Ethereum → TON: npm run bp run createBidirectionalOrder <contract> evm-to-ton 1 -3 <jetton> <sender> <receiver> <hashlock> <timelock> <amount> <evmContract>');
    ui.write('TON → TON: npm run bp run createBidirectionalOrder <contract> ton-to-ton -3 -3 <jetton> <sender> <receiver> <hashlock> <timelock> <amount>');
    ui.write('Partial Fill: npm run bp run partialFill <contract> fill <orderHash> <secret> <amount> <resolver>');
    ui.write('Deploy to Base: npm run bp run escrowFactory <contract> deploy 8453 <address>');
    ui.write('Register Relayer: npm run bp run relayerManagement <contract> register <address>');
    ui.write('Get Fund: npm run bp run getFund <contract> <secret> <hash>');

    ui.write('\n=== Hackathon Features ===');
    ui.write('🎯 Bi-directional swaps implemented');
    ui.write('🎯 HTLC with proper hashlock/timelock logic');
    ui.write('🎯 Escrow factory for target chain deployment');
    ui.write('🎯 Partial fills with multiple secrets');
    ui.write('🎯 Relayer/Resolver system for non-EVM chains');
    ui.write('🎯 Support for Base/Arbitrum/L2s');
    ui.write('🎯 Smart contract level only (no REST APIs)');
    ui.write('🎯 Improved jetton wallet calculation');
    ui.write('🎯 Enhanced error handling and validation');
} 