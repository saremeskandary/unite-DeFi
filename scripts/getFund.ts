import { Address, toNano } from '@ton/core';
import { TonFusion } from '../build/TonFusion/TonFusion_TonFusion';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();

    const contractAddress = Address.parse(args.length > 0 ? args[0] : await ui.input('TonFusion contract address'));
    const secret = BigInt(args.length > 1 ? args[1] : await ui.input('Secret (number)'));
    const hash = BigInt(args.length > 2 ? args[2] : await ui.input('Hash (order hashlock)'));

    if (!(await provider.isContractDeployed(contractAddress))) {
        ui.write(`Error: Contract at address ${contractAddress} is not deployed!`);
        return;
    }

    const tonFusion = provider.open(TonFusion.fromAddress(contractAddress));

    ui.write(`Claiming funds with secret: ${secret}`);
    ui.write(`Hash: ${hash}`);

    await tonFusion.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'GetFund',
            secret: secret,
            hash: hash,
            customPayload: null,
        }
    );

    ui.write('GetFund transaction sent successfully!');
    ui.write(`Secret: ${secret}`);
    ui.write(`Hash: ${hash}`);
    ui.write('Check your wallet for the claimed funds.');
} 