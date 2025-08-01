import { toNano } from '@ton/core';
import { TonFusion } from '../build/TonFusion/TonFusion_TonFusion';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const tonFusion = provider.open(await TonFusion.fromInit());

    await tonFusion.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        null,
    );

    await provider.waitForDeploy(tonFusion.address);

    console.log('TonFusion deployed successfully!');
    console.log('Contract address:', tonFusion.address.toString());
    console.log('Owner:', provider.sender().address?.toString());
}
