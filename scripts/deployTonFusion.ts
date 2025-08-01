import { toNano } from '@ton/core';
import { TonFusion } from '../build/TonFusion/TonFusion_TonFusion';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const tonFusion = provider.open(await TonFusion.fromInit(BigInt(Math.floor(Math.random() * 10000)), 0n));

    await tonFusion.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        null,
    );

    await provider.waitForDeploy(tonFusion.address);

    console.log('ID', await tonFusion.getId());
}
