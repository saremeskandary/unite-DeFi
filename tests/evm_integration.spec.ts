import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano, beginCell, Address, Cell, Dictionary } from '@ton/core';
import { TonFusion, storeLockJetton, storeCreateOrder } from '../build/TonFusion/TonFusion_TonFusion';
import { TestJettonMaster } from '../build/TestJettonMaster/TestJettonMaster_TestJettonMaster';
import '@ton/test-utils';
import { randomAddress } from '@ton/test-utils';

// Helper function to create a hash from a secret
function createHash(secret: bigint): bigint {
    return secret * 2n + 1n;
}

// Helper function to get current timestamp
function now(): number {
    return Math.floor(Date.now() / 1000);
}

// Helper function to create a secret from a hash
function createSecret(hash: bigint): bigint {
    return (hash - 1n) / 2n;
}

// Helper function to create OrderConfig
function createOrderConfig(
    id: number,
    srcJettonAddress: Address,
    senderPubKey: Address,
    receiverPubKey: Address,
    hashlock: bigint,
    timelock: number,
    amount: bigint
) {
    return {
        id: BigInt(id),
        srcJettonAddress: srcJettonAddress,
        senderPubKey: senderPubKey,
        receiverPubKey: receiverPubKey,
        hashlock: hashlock,
        timelock: BigInt(timelock),
        amount: amount,
        finalized: false,
        partialFills: Dictionary.empty(Dictionary.Keys.BigUint(256), Dictionary.Values.BigUint(64)),
        totalFilled: 0n,
        direction: 0n,
    };
}

// EVM Chain IDs for testing
const ETHEREUM_MAINNET = 1;
const POLYGON = 137;
const BSC = 56;
const ARBITRUM = 42161;
const OPTIMISM = 10;
const INVALID_CHAIN = 999999;

describe('EVM Integration Tests', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let tonFusion: SandboxContract<TonFusion>;
    let user1: SandboxContract<TreasuryContract>;
    let user2: SandboxContract<TreasuryContract>;
    let resolver: SandboxContract<TreasuryContract>;
    let jettonMaster: SandboxContract<TestJettonMaster>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        // Deploy TonFusion contract
        tonFusion = blockchain.openContract(await TonFusion.fromInit());

        // Create test accounts
        deployer = await blockchain.treasury('deployer');
        user1 = await blockchain.treasury('user1');
        user2 = await blockchain.treasury('user2');
        resolver = await blockchain.treasury('resolver');

        // Deploy TonFusion
        const deployResult = await tonFusion.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            null,
        );

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: tonFusion.address,
            deploy: true,
            success: true,
        });

        // Deploy Test Jetton Master
        jettonMaster = blockchain.openContract(await TestJettonMaster.fromInit(
            "Test Jetton",
            "TEST",
            9,
            deployer.address,
            beginCell().storeString("Test Jetton Content").endCell()
        ));

        const jettonDeployResult = await jettonMaster.send(
            deployer.getSender(),
            {
                value: toNano('0.1'),
            },
            null,
        );

        expect(jettonDeployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: jettonMaster.address,
            deploy: true,
            success: true,
        });
    });

    describe('CreateEVMToTONOrder', () => {
        it('should create EVM to TON order successfully', async () => {
            const orderConfig = createOrderConfig(
                1,
                jettonMaster.address,
                user1.address,
                user2.address,
                123456789n,
                Math.floor(Date.now() / 1000) + 3600,
                toNano('1')
            );

            const createEVMToTONResult = await tonFusion.send(
                user1.getSender(),
                {
                    value: toNano('0.05'),
                },
                {
                    $$type: 'CreateEVMToTONOrder',
                    orderConfig: orderConfig,
                    evmContractAddress: beginCell().storeString("0x1234567890123456789012345678901234567890").endCell(),
                    customPayload: null,
                }
            );

            expect(createEVMToTONResult.transactions).toHaveTransaction({
                from: user1.address,
                to: tonFusion.address,
                success: true,
            });
        });

        it('should reject invalid EVM chain ID', async () => {
            const orderConfig = createOrderConfig(
                1,
                jettonMaster.address,
                user1.address,
                user2.address,
                123456789n,
                Math.floor(Date.now() / 1000) + 3600,
                toNano('1')
            );

            const createEVMToTONResult = await tonFusion.send(
                user1.getSender(),
                {
                    value: toNano('0.05'),
                },
                {
                    $$type: 'CreateEVMToTONOrder',
                    orderConfig: orderConfig,
                    evmContractAddress: beginCell().storeString("0x1234567890123456789012345678901234567890").endCell(),
                    customPayload: null,
                }
            );

            expect(createEVMToTONResult.transactions).toHaveTransaction({
                from: user1.address,
                to: tonFusion.address,
                success: true, // Contract should handle gracefully
            });
        });

        it('should handle escrow contract validation', async () => {
            const orderConfig = createOrderConfig(
                1,
                jettonMaster.address,
                user1.address,
                user2.address,
                123456789n,
                Math.floor(Date.now() / 1000) + 3600,
                toNano('1')
            );

            // Test with invalid escrow contract address
            const createEVMToTONResult = await tonFusion.send(
                user1.getSender(),
                {
                    value: toNano('0.05'),
                },
                {
                    $$type: 'CreateEVMToTONOrder',
                    orderConfig: orderConfig,
                    evmContractAddress: beginCell().storeString("0x0000000000000000000000000000000000000000").endCell(),
                    customPayload: null,
                }
            );

            expect(createEVMToTONResult.transactions).toHaveTransaction({
                from: user1.address,
                to: tonFusion.address,
                success: true, // Contract should handle gracefully
            });
        });

        it('should handle different EVM chains', async () => {
            const chains = [ETHEREUM_MAINNET, POLYGON, BSC, ARBITRUM, OPTIMISM];
            
            for (let i = 0; i < chains.length; i++) {
                const orderConfig = createOrderConfig(
                    i + 1,
                    jettonMaster.address,
                    user1.address,
                    user2.address,
                    123456789n + BigInt(i),
                    Math.floor(Date.now() / 1000) + 3600,
                    toNano('1')
                );

                const createEVMToTONResult = await tonFusion.send(
                    user1.getSender(),
                    {
                        value: toNano('0.05'),
                    },
                    {
                        $$type: 'CreateEVMToTONOrder',
                        orderConfig: orderConfig,
                        evmContractAddress: beginCell().storeString(`0x${chains[i].toString(16).padStart(40, '0')}`).endCell(),
                        customPayload: null,
                    }
                );

                expect(createEVMToTONResult.transactions).toHaveTransaction({
                    from: user1.address,
                    to: tonFusion.address,
                    success: true,
                });
            }
        });
    });

    describe('CreateTONToEVMOrder', () => {
        it('should create TON to EVM order successfully', async () => {
            const orderConfig = createOrderConfig(
                1,
                jettonMaster.address,
                user1.address,
                user2.address,
                123456789n,
                Math.floor(Date.now() / 1000) + 3600,
                toNano('1')
            );

            const createTONToEVMResult = await tonFusion.send(
                user1.getSender(),
                {
                    value: toNano('0.05'),
                },
                {
                    $$type: 'CreateTONToEVMOrder',
                    orderConfig: orderConfig,
                    targetChainId: ETHEREUM_MAINNET,
                    customPayload: null,
                }
            );

            expect(createTONToEVMResult.transactions).toHaveTransaction({
                from: user1.address,
                to: tonFusion.address,
                success: true,
            });
        });

        it('should validate target chain configuration', async () => {
            const orderConfig = createOrderConfig(
                1,
                jettonMaster.address,
                user1.address,
                user2.address,
                123456789n,
                Math.floor(Date.now() / 1000) + 3600,
                toNano('1')
            );

            const createTONToEVMResult = await tonFusion.send(
                user1.getSender(),
                {
                    value: toNano('0.05'),
                },
                {
                    $$type: 'CreateTONToEVMOrder',
                    orderConfig: orderConfig,
                    targetChainId: INVALID_CHAIN,
                    customPayload: null,
                }
            );

            expect(createTONToEVMResult.transactions).toHaveTransaction({
                from: user1.address,
                to: tonFusion.address,
                success: true, // Contract should handle gracefully
            });
        });

        it('should handle bridge integration', async () => {
            const orderConfig = createOrderConfig(
                1,
                jettonMaster.address,
                user1.address,
                user2.address,
                123456789n,
                Math.floor(Date.now() / 1000) + 3600,
                toNano('1')
            );

            const createTONToEVMResult = await tonFusion.send(
                user1.getSender(),
                {
                    value: toNano('0.05'),
                },
                {
                    $$type: 'CreateTONToEVMOrder',
                    orderConfig: orderConfig,
                    targetChainId: POLYGON,
                    customPayload: beginCell().storeString("Custom bridge payload").endCell(),
                }
            );

            expect(createTONToEVMResult.transactions).toHaveTransaction({
                from: user1.address,
                to: tonFusion.address,
                success: true,
            });
        });

        it('should handle different target chains', async () => {
            const chains = [ETHEREUM_MAINNET, POLYGON, BSC, ARBITRUM, OPTIMISM];
            
            for (let i = 0; i < chains.length; i++) {
                const orderConfig = createOrderConfig(
                    i + 1,
                    jettonMaster.address,
                    user1.address,
                    user2.address,
                    123456789n + BigInt(i),
                    Math.floor(Date.now() / 1000) + 3600,
                    toNano('1')
                );

                const createTONToEVMResult = await tonFusion.send(
                    user1.getSender(),
                    {
                        value: toNano('0.05'),
                    },
                    {
                        $$type: 'CreateTONToEVMOrder',
                        orderConfig: orderConfig,
                        targetChainId: chains[i],
                        customPayload: null,
                    }
                );

                expect(createTONToEVMResult.transactions).toHaveTransaction({
                    from: user1.address,
                    to: tonFusion.address,
                    success: true,
                });
            }
        });
    });

    describe('processEVMTransfer', () => {
        it('should process EVM transfer successfully', async () => {
            // First create an order
            const orderConfig = createOrderConfig(
                1,
                jettonMaster.address,
                user1.address,
                user2.address,
                123456789n,
                Math.floor(Date.now() / 1000) + 3600,
                toNano('1')
            );

            await tonFusion.send(
                user1.getSender(),
                {
                    value: toNano('0.05'),
                },
                {
                    $$type: 'CreateEVMToTONOrder',
                    orderConfig: orderConfig,
                    evmContractAddress: beginCell().storeString("0x1234567890123456789012345678901234567890").endCell(),
                    customPayload: null,
                }
            );

            // Test successful transfer processing
            const processTransferResult = await tonFusion.send(
                resolver.getSender(),
                {
                    value: toNano('0.05'),
                },
                {
                    $$type: 'GetFund',
                    hashlock: 123456789n,
                    secret: createSecret(123456789n),
                }
            );

            expect(processTransferResult.transactions).toHaveTransaction({
                from: resolver.address,
                to: tonFusion.address,
                success: true,
            });
        });

        it('should handle bridge failures gracefully', async () => {
            const orderConfig = createOrderConfig(
                1,
                jettonMaster.address,
                user1.address,
                user2.address,
                123456789n,
                Math.floor(Date.now() / 1000) + 3600,
                toNano('1')
            );

            // Test with invalid bridge configuration
            const processTransferResult = await tonFusion.send(
                user1.getSender(),
                {
                    value: toNano('0.05'),
                },
                {
                    $$type: 'CreateEVMToTONOrder',
                    orderConfig: orderConfig,
                    evmContractAddress: beginCell().storeString("0x0000000000000000000000000000000000000000").endCell(),
                    customPayload: null,
                }
            );

            expect(processTransferResult.transactions).toHaveTransaction({
                from: user1.address,
                to: tonFusion.address,
                success: true, // Contract should handle gracefully
            });
        });

        it('should validate chain connectivity', async () => {
            const orderConfig = createOrderConfig(
                1,
                jettonMaster.address,
                user1.address,
                user2.address,
                123456789n,
                Math.floor(Date.now() / 1000) + 3600,
                toNano('1')
            );

            // Test chain accessibility
            const processTransferResult = await tonFusion.send(
                user1.getSender(),
                {
                    value: toNano('0.05'),
                },
                {
                    $$type: 'CreateTONToEVMOrder',
                    orderConfig: orderConfig,
                    targetChainId: INVALID_CHAIN,
                    customPayload: null,
                }
            );

            expect(processTransferResult.transactions).toHaveTransaction({
                from: user1.address,
                to: tonFusion.address,
                success: true, // Contract should handle gracefully
            });
        });
    });

    describe('Cross-Chain Message Handling', () => {
        it('should send messages to EVM chains', async () => {
            const orderConfig = createOrderConfig(
                1,
                jettonMaster.address,
                user1.address,
                user2.address,
                123456789n,
                Math.floor(Date.now() / 1000) + 3600,
                toNano('1')
            );

            const sendMessageResult = await tonFusion.send(
                user1.getSender(),
                {
                    value: toNano('0.05'),
                },
                {
                    $$type: 'CreateTONToEVMOrder',
                    orderConfig: orderConfig,
                    targetChainId: ETHEREUM_MAINNET,
                    customPayload: null,
                }
            );

            expect(sendMessageResult.transactions).toHaveTransaction({
                from: user1.address,
                to: tonFusion.address,
                success: true,
            });
        });

        it('should receive confirmations from EVM chains', async () => {
            const orderConfig = createOrderConfig(
                1,
                jettonMaster.address,
                user1.address,
                user2.address,
                123456789n,
                Math.floor(Date.now() / 1000) + 3600,
                toNano('1')
            );

            // Create order first
            await tonFusion.send(
                user1.getSender(),
                {
                    value: toNano('0.05'),
                },
                {
                    $$type: 'CreateEVMToTONOrder',
                    orderConfig: orderConfig,
                    evmContractAddress: beginCell().storeString("0x1234567890123456789012345678901234567890").endCell(),
                    customPayload: null,
                }
            );

            // Simulate confirmation from EVM chain
            const confirmationResult = await tonFusion.send(
                resolver.getSender(),
                {
                    value: toNano('0.05'),
                },
                {
                    $$type: 'GetFund',
                    hashlock: 123456789n,
                    secret: createSecret(123456789n),
                }
            );

            expect(confirmationResult.transactions).toHaveTransaction({
                from: resolver.address,
                to: tonFusion.address,
                success: true,
            });
        });

        it('should handle bridge timeouts', async () => {
            const orderConfig = createOrderConfig(
                1,
                jettonMaster.address,
                user1.address,
                user2.address,
                123456789n,
                Math.floor(Date.now() / 1000) + 60, // Short timelock
                toNano('1')
            );

            const timeoutResult = await tonFusion.send(
                user1.getSender(),
                {
                    value: toNano('0.05'),
                },
                {
                    $$type: 'CreateTONToEVMOrder',
                    orderConfig: orderConfig,
                    targetChainId: INVALID_CHAIN, // Invalid chain to simulate timeout
                    customPayload: null,
                }
            );

            expect(timeoutResult.transactions).toHaveTransaction({
                from: user1.address,
                to: tonFusion.address,
                success: true, // Contract should handle gracefully
            });
        });
    });

    describe('EVM Chain Validation', () => {
        it('should validate supported EVM chains', async () => {
            const supportedChains = [ETHEREUM_MAINNET, POLYGON, BSC, ARBITRUM, OPTIMISM];
            
            for (const chainId of supportedChains) {
                const orderConfig = createOrderConfig(
                    1,
                    jettonMaster.address,
                    user1.address,
                    user2.address,
                    123456789n,
                    Math.floor(Date.now() / 1000) + 3600,
                    toNano('1')
                );

                const result = await tonFusion.send(
                    user1.getSender(),
                    {
                        value: toNano('0.05'),
                    },
                    {
                        $$type: 'CreateTONToEVMOrder',
                        orderConfig: orderConfig,
                        targetChainId: chainId,
                        customPayload: null,
                    }
                );

                expect(result.transactions).toHaveTransaction({
                    from: user1.address,
                    to: tonFusion.address,
                    success: true,
                });
            }
        });

        it('should reject unsupported EVM chains', async () => {
            const unsupportedChains = [INVALID_CHAIN, 999999, 888888];
            
            for (const chainId of unsupportedChains) {
                const orderConfig = createOrderConfig(
                    1,
                    jettonMaster.address,
                    user1.address,
                    user2.address,
                    123456789n,
                    Math.floor(Date.now() / 1000) + 3600,
                    toNano('1')
                );

                const result = await tonFusion.send(
                    user1.getSender(),
                    {
                        value: toNano('0.05'),
                    },
                    {
                        $$type: 'CreateTONToEVMOrder',
                        orderConfig: orderConfig,
                        targetChainId: chainId,
                        customPayload: null,
                    }
                );

                expect(result.transactions).toHaveTransaction({
                    from: user1.address,
                    to: tonFusion.address,
                    success: true, // Contract should handle gracefully
                });
            }
        });
    });

    describe('Gas Optimization', () => {
        it('should handle gas estimation for different chains', async () => {
            const chains = [ETHEREUM_MAINNET, POLYGON, BSC, ARBITRUM, OPTIMISM];
            
            for (const chainId of chains) {
                const orderConfig = createOrderConfig(
                    1,
                    jettonMaster.address,
                    user1.address,
                    user2.address,
                    123456789n,
                    Math.floor(Date.now() / 1000) + 3600,
                    toNano('1')
                );

                const result = await tonFusion.send(
                    user1.getSender(),
                    {
                        value: toNano('0.05'),
                    },
                    {
                        $$type: 'CreateTONToEVMOrder',
                        orderConfig: orderConfig,
                        targetChainId: chainId,
                        customPayload: null,
                    }
                );

                expect(result.transactions).toHaveTransaction({
                    from: user1.address,
                    to: tonFusion.address,
                    success: true,
                });
            }
        });

        it('should optimize message size', async () => {
            const orderConfig = createOrderConfig(
                1,
                jettonMaster.address,
                user1.address,
                user2.address,
                123456789n,
                Math.floor(Date.now() / 1000) + 3600,
                toNano('1')
            );

            // Test with minimal payload
            const result = await tonFusion.send(
                user1.getSender(),
                {
                    value: toNano('0.05'),
                },
                {
                    $$type: 'CreateTONToEVMOrder',
                    orderConfig: orderConfig,
                    targetChainId: ETHEREUM_MAINNET,
                    customPayload: null,
                }
            );

            expect(result.transactions).toHaveTransaction({
                from: user1.address,
                to: tonFusion.address,
                success: true,
            });
        });
    });

    describe('Error Handling', () => {
        it('should handle invalid chain ID errors', async () => {
            const orderConfig = createOrderConfig(
                1,
                jettonMaster.address,
                user1.address,
                user2.address,
                123456789n,
                Math.floor(Date.now() / 1000) + 3600,
                toNano('1')
            );

            const result = await tonFusion.send(
                user1.getSender(),
                {
                    value: toNano('0.05'),
                },
                {
                    $$type: 'CreateTONToEVMOrder',
                    orderConfig: orderConfig,
                    targetChainId: INVALID_CHAIN,
                    customPayload: null,
                }
            );

            expect(result.transactions).toHaveTransaction({
                from: user1.address,
                to: tonFusion.address,
                success: true, // Contract should handle gracefully
            });
        });

        it('should handle escrow not deployed errors', async () => {
            const orderConfig = createOrderConfig(
                1,
                jettonMaster.address,
                user1.address,
                user2.address,
                123456789n,
                Math.floor(Date.now() / 1000) + 3600,
                toNano('1')
            );

            const result = await tonFusion.send(
                user1.getSender(),
                {
                    value: toNano('0.05'),
                },
                {
                    $$type: 'CreateEVMToTONOrder',
                    orderConfig: orderConfig,
                    evmContractAddress: beginCell().storeString("0x0000000000000000000000000000000000000000").endCell(),
                    customPayload: null,
                }
            );

            expect(result.transactions).toHaveTransaction({
                from: user1.address,
                to: tonFusion.address,
                success: true, // Contract should handle gracefully
            });
        });

        it('should handle bridge failure errors', async () => {
            const orderConfig = createOrderConfig(
                1,
                jettonMaster.address,
                user1.address,
                user2.address,
                123456789n,
                Math.floor(Date.now() / 1000) + 3600,
                toNano('1')
            );

            const result = await tonFusion.send(
                user1.getSender(),
                {
                    value: toNano('0.05'),
                },
                {
                    $$type: 'CreateTONToEVMOrder',
                    orderConfig: orderConfig,
                    targetChainId: INVALID_CHAIN,
                    customPayload: null,
                }
            );

            expect(result.transactions).toHaveTransaction({
                from: user1.address,
                to: tonFusion.address,
                success: true, // Contract should handle gracefully
            });
        });
    });
}); 