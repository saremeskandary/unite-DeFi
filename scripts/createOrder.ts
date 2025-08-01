import { Address, toNano, beginCell } from '@ton/core';
import { TonFusion } from '../build/TonFusion/TonFusion_TonFusion';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();

    const contractAddress = Address.parse(args.length > 0 ? args[0] : await ui.input('TonFusion contract address'));
    const orderType = args.length > 1 ? args[1] : await ui.input('Order type (lock/create)');
    const chainId = parseInt(args.length > 2 ? args[2] : await ui.input('Chain ID (e.g., 1 for Ethereum, -3 for TON)'));
    const srcJettonAddress = Address.parse(args.length > 3 ? args[3] : await ui.input('Source jetton address'));
    const senderPubKey = Address.parse(args.length > 4 ? args[4] : await ui.input('Sender public key'));
    const receiverPubKey = orderType === 'lock' ? Address.parse(args.length > 5 ? args[5] : await ui.input('Receiver public key')) : null;
    const hashlock = BigInt(args.length > 6 ? args[6] : await ui.input('Hashlock (secret hash)'));
    const timelock = parseInt(args.length > 7 ? args[7] : await ui.input('Timelock (unix timestamp)'));
    const amount = toNano(args.length > 8 ? args[8] : await ui.input('Amount (in TON)'));
    const jettonData = args.length > 9 ? args[9] : await ui.input('Jetton data (hex)');

    if (!(await provider.isContractDeployed(contractAddress))) {
        ui.write(`Error: Contract at address ${contractAddress} is not deployed!`);
        return;
    }

    const tonFusion = provider.open(TonFusion.fromAddress(contractAddress));

    // Create jetton cell
    const jetton = beginCell().storeUint(0, 32).endCell(); // Mock jetton data

    ui.write(`Creating ${orderType} order...`);
    ui.write(`Chain ID: ${chainId}`);
    ui.write(`Amount: ${amount}`);
    ui.write(`Hashlock: ${hashlock}`);
    ui.write(`Timelock: ${timelock}`);

    if (orderType === 'lock') {
        // Create LockJetton order (cross-chain)
        const orderConfig = {
            id: chainId,
            srcJettonAddress: srcJettonAddress,
            senderPubKey: senderPubKey,
            receiverPubKey: receiverPubKey!,
            hashlock: hashlock,
            timelock: timelock,
            amount: amount,
            finalized: false,
        };

        const lockJettonMsg = {
            $$type: 'LockJetton' as const,
            orderConfig: orderConfig,
            jetton: jetton,
            customPayload: null,
        };

        const jettonNotifyMsg = {
            $$type: 'JettonNotifyWithActionRequest' as const,
            queryId: 0n,
            amount: amount,
            sender: senderPubKey,
            actionOpcode: 0xf512f7dfn, // LockJetton opcode
            actionPayload: beginCell().store(lockJettonMsg).endCell(),
        };

        await tonFusion.send(
            provider.sender(),
            {
                value: toNano('0.05'),
            },
            jettonNotifyMsg
        );
    } else if (orderType === 'create') {
        // Create CreateOrder (same-chain)
        const order = {
            id: chainId,
            srcJettonAddress: srcJettonAddress,
            senderPubKey: senderPubKey,
            hashlock: hashlock,
            timelock: timelock,
            amount: amount,
        };

        const createOrderMsg = {
            $$type: 'CreateOrder' as const,
            orderConfig: order,
            jetton: jetton,
            customPayload: null,
        };

        const jettonNotifyMsg = {
            $$type: 'JettonNotifyWithActionRequest' as const,
            queryId: 0n,
            amount: amount,
            sender: senderPubKey,
            actionOpcode: 0x7362d09cn, // CreateOrder opcode
            actionPayload: beginCell().store(createOrderMsg).endCell(),
        };

        await tonFusion.send(
            provider.sender(),
            {
                value: toNano('0.05'),
            },
            jettonNotifyMsg
        );
    } else {
        ui.write('Error: Invalid order type. Use "lock" or "create"');
        return;
    }

    ui.write('Order created successfully!');
    ui.write(`Order type: ${orderType}`);
    ui.write(`Hashlock: ${hashlock}`);
} 