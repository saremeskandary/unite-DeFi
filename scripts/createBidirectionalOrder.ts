import { Address, toNano, beginCell, Cell, Dictionary } from '@ton/core';
import { TonFusion, storeCreateOrder } from '../build/TonFusion/TonFusion_TonFusion';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();

    const contractAddress = Address.parse(args.length > 0 ? args[0] : await ui.input('TonFusion contract address'));
    const direction = args.length > 1 ? args[1] : await ui.input('Direction (ton-to-evm/evm-to-ton/ton-to-ton)');
    const fromChainId = parseInt(args.length > 2 ? args[2] : await ui.input('From Chain ID'));
    const toChainId = parseInt(args.length > 3 ? args[3] : await ui.input('To Chain ID'));
    const srcJettonAddress = Address.parse(args.length > 4 ? args[4] : await ui.input('Source jetton address'));
    const senderPubKey = Address.parse(args.length > 5 ? args[5] : await ui.input('Sender public key'));
    const receiverPubKey = Address.parse(args.length > 6 ? args[6] : await ui.input('Receiver public key'));
    const hashlock = BigInt(args.length > 7 ? args[7] : await ui.input('Hashlock (secret hash)'));
    const timelock = parseInt(args.length > 8 ? args[8] : await ui.input('Timelock (unix timestamp)'));
    const amount = toNano(args.length > 9 ? args[9] : await ui.input('Amount (in TON)'));

    if (!(await provider.isContractDeployed(contractAddress))) {
        ui.write(`Error: Contract at address ${contractAddress} is not deployed!`);
        return;
    }

    const tonFusion = provider.open(TonFusion.fromAddress(contractAddress));

    ui.write(`Creating ${direction} order...`);
    ui.write(`From Chain: ${fromChainId}`);
    ui.write(`To Chain: ${toChainId}`);
    ui.write(`Amount: ${amount}`);
    ui.write(`Hashlock: ${hashlock}`);

    if (direction === 'ton-to-evm') {
        // TON → EVM order
        const orderConfig = {
            $$type: 'OrderConfig' as const,
            id: BigInt(toChainId),
            srcJettonAddress: srcJettonAddress,
            senderPubKey: senderPubKey,
            receiverPubKey: receiverPubKey,
            hashlock: hashlock,
            timelock: BigInt(timelock),
            amount: amount,
            finalized: false,
            partialFills: Dictionary.empty(Dictionary.Keys.BigUint(256), Dictionary.Values.BigUint(64)),
            totalFilled: 0n,
            direction: 0n, // TON_TO_EVM
        };

        const evmContractAddress = beginCell().storeAddress(Address.parse(args.length > 10 ? args[10] : await ui.input('EVM contract address'))).endCell();

        const createOrderMsg = {
            $$type: 'CreateTONToEVMOrder' as const,
            orderConfig: orderConfig,
            evmContractAddress: evmContractAddress,
            customPayload: null,
        };

        await tonFusion.send(
            provider.sender(),
            {
                value: toNano('0.05'),
            },
            createOrderMsg
        );
    } else if (direction === 'evm-to-ton') {
        // EVM → TON order
        const orderConfig = {
            $$type: 'OrderConfig' as const,
            id: BigInt(fromChainId),
            srcJettonAddress: srcJettonAddress,
            senderPubKey: senderPubKey,
            receiverPubKey: receiverPubKey,
            hashlock: hashlock,
            timelock: BigInt(timelock),
            amount: amount,
            finalized: false,
            partialFills: Dictionary.empty(Dictionary.Keys.BigUint(256), Dictionary.Values.BigUint(64)),
            totalFilled: 0n,
            direction: 1n, // EVM_TO_TON
        };

        const evmContractAddress = beginCell().storeAddress(Address.parse(args.length > 10 ? args[10] : await ui.input('EVM contract address'))).endCell();

        const createOrderMsg = {
            $$type: 'CreateEVMToTONOrder' as const,
            orderConfig: orderConfig,
            evmContractAddress: evmContractAddress,
            customPayload: null,
        };

        await tonFusion.send(
            provider.sender(),
            {
                value: toNano('0.05'),
            },
            createOrderMsg
        );
    } else if (direction === 'ton-to-ton') {
        // TON → TON order
        const order = {
            $$type: 'Order' as const,
            id: BigInt(toChainId),
            srcJettonAddress: srcJettonAddress,
            senderPubKey: senderPubKey,
            hashlock: hashlock,
            timelock: BigInt(timelock),
            amount: amount,
            finalized: false,
            partialFills: Dictionary.empty(Dictionary.Keys.BigUint(256), Dictionary.Values.BigUint(64)),
            totalFilled: 0n,
            direction: 2n, // TON_TO_TON
        };

        const jetton = beginCell().storeUint(0, 32).endCell();

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
            actionPayload: beginCell().store(storeCreateOrder(createOrderMsg)).endCell(),
        };

        await tonFusion.send(
            provider.sender(),
            {
                value: toNano('0.05'),
            },
            jettonNotifyMsg
        );
    } else {
        ui.write('Error: Invalid direction. Use "ton-to-evm", "evm-to-ton", or "ton-to-ton"');
        return;
    }

    ui.write(`${direction} order created successfully!`);
    ui.write(`Direction: ${direction}`);
    ui.write(`Hashlock: ${hashlock}`);
    ui.write(`Amount: ${amount}`);
} 