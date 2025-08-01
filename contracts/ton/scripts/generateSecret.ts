import { Address } from '@ton/core';
import { NetworkProvider } from '@ton/blueprint';
import { randomBytes } from 'crypto';

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();

    ui.write('=== TonFusion Secret Generator ===');
    ui.write('This utility generates secrets and hashes for testing the TonFusion contract.');

    // Generate random secret
    const secretBytes = randomBytes(32);
    const secret = BigInt('0x' + secretBytes.toString('hex'));
    
    // Generate hash (simplified for testing)
    const hash = secret * 2n + 1n;

    ui.write('\n=== Generated Values ===');
    ui.write(`Secret: ${secret}`);
    ui.write(`Hash: ${hash}`);
    ui.write(`Secret (hex): 0x${secretBytes.toString('hex')}`);
    ui.write(`Hash (hex): 0x${hash.toString(16)}`);

    ui.write('\n=== Usage Examples ===');
    ui.write('Create Lock Order (TON → Ethereum):');
    ui.write(`npm run bp run createOrder <contract> lock 1 <jetton> <sender> <receiver> ${hash} <timelock> <amount>`);
    
    ui.write('\nCreate Order (TON → TON):');
    ui.write(`npm run bp run createOrder <contract> create -3 <jetton> <sender> ${hash} <timelock> <amount>`);
    
    ui.write('\nGet Fund:');
    ui.write(`npm run bp run getFund <contract> ${secret} ${hash}`);

    ui.write('\n=== Chain IDs ===');
    ui.write('1 = Ethereum Mainnet');
    ui.write('137 = Polygon');
    ui.write('56 = BSC');
    ui.write('-3 = TON Mainnet');
    ui.write('-239 = TON Testnet');

    ui.write('\n=== Timelock Examples ===');
    const now = Math.floor(Date.now() / 1000);
    ui.write(`Current time: ${now}`);
    ui.write(`1 hour from now: ${now + 3600}`);
    ui.write(`1 day from now: ${now + 86400}`);
    ui.write(`1 week from now: ${now + 604800}`);

    ui.write('\n=== Security Notes ===');
    ui.write('⚠️  Keep the secret private!');
    ui.write('⚠️  Only share the hash publicly');
    ui.write('⚠️  The secret is needed to claim funds');
    ui.write('⚠️  Anyone with the secret can claim the funds');
} 