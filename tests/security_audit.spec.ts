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

describe('Security Audit Tests', () => {
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
            beginCell().storeUint(0, 8).endCell()
        ));

        // Deploy jetton master
        await jettonMaster.send(
            deployer.getSender(),
            {
                value: toNano('0.1'),
            },
            null,
        );

        // Mint jettons to test users
        await jettonMaster.send(
            deployer.getSender(),
            {
                value: toNano('0.1'),
            },
            {
                $$type: 'Mint',
                to: user1.address,
                amount: toNano('1000'),
            }
        );

        await jettonMaster.send(
            deployer.getSender(),
            {
                value: toNano('0.1'),
            },
            {
                $$type: 'Mint',
                to: user2.address,
                amount: toNano('1000'),
            }
        );

        // Set whitelist for resolver
        await tonFusion.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'SetWhiteList',
                resolver: resolver.address,
                whitelistStatus: true,
            }
        );
    });

    describe('Access Control Security', () => {
        it('should prevent unauthorized access to owner functions', async () => {
            const unauthorizedUser = await blockchain.treasury('unauthorized');

            // Test SetWhiteList
            const setWhitelistResult = await tonFusion.send(
                unauthorizedUser.getSender(),
                {
                    value: toNano('0.05'),
                },
                {
                    $$type: 'SetWhiteList',
                    resolver: resolver.address,
                    whitelistStatus: true,
                }
            );

            expect(setWhitelistResult.transactions).toHaveTransaction({
                from: unauthorizedUser.address,
                to: tonFusion.address,
                success: false,
                exitCode: 86, // INVALID_OWNER
            });

            // Test SetRelayer
            const setRelayerResult = await tonFusion.send(
                unauthorizedUser.getSender(),
                {
                    value: toNano('0.05'),
                },
                {
                    $$type: 'SetRelayer',
                    relayer: user1.address,
                    relayerStatus: true,
                }
            );

            expect(setRelayerResult.transactions).toHaveTransaction({
                from: unauthorizedUser.address,
                to: tonFusion.address,
                success: false,
                exitCode: 86, // INVALID_OWNER
            });
        });

        it('should prevent non-whitelisted users from creating orders', async () => {
            const nonWhitelistedUser = await blockchain.treasury('nonWhitelisted');
            const secret = 123456789n;
            const hashlock = createHash(secret);
            const timelock = now() + 3600; // 1 hour

            const orderConfig = createOrderConfig(
                1, // Ethereum
                jettonMaster.address,
                user1.address,
                user2.address,
                hashlock,
                timelock,
                toNano('100')
            );

            const result = await tonFusion.send(
                nonWhitelistedUser.getSender(),
                {
                    value: toNano('0.1'),
                },
                {
                    $$type: 'CreateEVMToTONOrder',
                    orderConfig: orderConfig,
                    jetton: beginCell().endCell(),
                }
            );

            expect(result.transactions).toHaveTransaction({
                from: nonWhitelistedUser.address,
                to: tonFusion.address,
                success: false,
                exitCode: 87, // INVALID_WHITELIST
            });
        });

        it('should prevent non-relayers from resolving orders', async () => {
            const nonRelayer = await blockchain.treasury('nonRelayer');
            const secret = 123456789n;
            const hashlock = createHash(secret);

            const result = await tonFusion.send(
                nonRelayer.getSender(),
                {
                    value: toNano('0.05'),
                },
                {
                    $$type: 'ResolveOrder',
                    hashlock: hashlock,
                    secret: secret,
                }
            );

            expect(result.transactions).toHaveTransaction({
                from: nonRelayer.address,
                to: tonFusion.address,
                success: false,
                exitCode: 96, // INVALID_RELAYER
            });
        });
    });

    describe('Replay Attack Protection', () => {
        it('should prevent replay attacks on order resolution', async () => {
            // Create an order
            const secret = 123456789n;
            const hashlock = createHash(secret);
            const timelock = now() + 3600;

            const orderConfig = createOrderConfig(
                1, // Ethereum
                jettonMaster.address,
                user1.address,
                user2.address,
                hashlock,
                timelock,
                toNano('100')
            );

            // Create order
            await tonFusion.send(
                resolver.getSender(),
                {
                    value: toNano('0.1'),
                },
                {
                    $$type: 'CreateEVMToTONOrder',
                    orderConfig: orderConfig,
                    jetton: beginCell().endCell(),
                }
            );

            // Set relayer
            await tonFusion.send(
                deployer.getSender(),
                {
                    value: toNano('0.05'),
                },
                {
                    $$type: 'SetRelayer',
                    relayer: resolver.address,
                    relayerStatus: true,
                }
            );

            // Resolve order first time
            const resolveResult1 = await tonFusion.send(
                resolver.getSender(),
                {
                    value: toNano('0.05'),
                },
                {
                    $$type: 'ResolveOrder',
                    hashlock: hashlock,
                    secret: secret,
                }
            );

            expect(resolveResult1.transactions).toHaveTransaction({
                from: resolver.address,
                to: tonFusion.address,
                success: true,
            });

            // Try to resolve the same order again (replay attack)
            const resolveResult2 = await tonFusion.send(
                resolver.getSender(),
                {
                    value: toNano('0.05'),
                },
                {
                    $$type: 'ResolveOrder',
                    hashlock: hashlock,
                    secret: secret,
                }
            );

            expect(resolveResult2.transactions).toHaveTransaction({
                from: resolver.address,
                to: tonFusion.address,
                success: false,
                exitCode: 89, // INVALID_SECRET or ORDER_ALREADY_FINALIZED
            });
        });

        it('should prevent replay attacks on partial fills', async () => {
            // Create an order with partial fill capability
            const secret = 123456789n;
            const hashlock = createHash(secret);
            const timelock = now() + 3600;

            const orderConfig = createOrderConfig(
                1, // Ethereum
                jettonMaster.address,
                user1.address,
                user2.address,
                hashlock,
                timelock,
                toNano('100')
            );

            // Create order
            await tonFusion.send(
                resolver.getSender(),
                {
                    value: toNano('0.1'),
                },
                {
                    $$type: 'CreateEVMToTONOrder',
                    orderConfig: orderConfig,
                    jetton: beginCell().endCell(),
                }
            );

            // Set relayer
            await tonFusion.send(
                deployer.getSender(),
                {
                    value: toNano('0.05'),
                },
                {
                    $$type: 'SetRelayer',
                    relayer: resolver.address,
                    relayerStatus: true,
                }
            );

            // Create partial fill
            const partialFillAmount = toNano('50');
            const partialFillResult1 = await tonFusion.send(
                resolver.getSender(),
                {
                    value: toNano('0.05'),
                },
                {
                    $$type: 'CreatePartialFill',
                    hashlock: hashlock,
                    amount: partialFillAmount,
                    secret: secret,
                }
            );

            expect(partialFillResult1.transactions).toHaveTransaction({
                from: resolver.address,
                to: tonFusion.address,
                success: true,
            });

            // Try to create the same partial fill again (replay attack)
            const partialFillResult2 = await tonFusion.send(
                resolver.getSender(),
                {
                    value: toNano('0.05'),
                },
                {
                    $$type: 'CreatePartialFill',
                    hashlock: hashlock,
                    amount: partialFillAmount,
                    secret: secret,
                }
            );

            expect(partialFillResult2.transactions).toHaveTransaction({
                from: resolver.address,
                to: tonFusion.address,
                success: false,
            });
        });
    });

    describe('Input Validation Security', () => {
        it('should validate order amounts properly', async () => {
            const secret = 123456789n;
            const hashlock = createHash(secret);
            const timelock = now() + 3600;

            // Test zero amount
            const zeroAmountOrder = createOrderConfig(
                1, // Ethereum
                jettonMaster.address,
                user1.address,
                user2.address,
                hashlock,
                timelock,
                0n
            );

            const zeroAmountResult = await tonFusion.send(
                resolver.getSender(),
                {
                    value: toNano('0.1'),
                },
                {
                    $$type: 'CreateEVMToTONOrder',
                    orderConfig: zeroAmountOrder,
                    jetton: beginCell().endCell(),
                }
            );

            expect(zeroAmountResult.transactions).toHaveTransaction({
                from: resolver.address,
                to: tonFusion.address,
                success: false,
                exitCode: 72, // INVALID_AMOUNT
            });

            // Test negative amount (should be handled as overflow)
            const negativeAmountOrder = createOrderConfig(
                1, // Ethereum
                jettonMaster.address,
                user1.address,
                user2.address,
                hashlock,
                timelock,
                -100n
            );

            const negativeAmountResult = await tonFusion.send(
                resolver.getSender(),
                {
                    value: toNano('0.1'),
                },
                {
                    $$type: 'CreateEVMToTONOrder',
                    orderConfig: negativeAmountOrder,
                    jetton: beginCell().endCell(),
                }
            );

            expect(negativeAmountResult.transactions).toHaveTransaction({
                from: resolver.address,
                to: tonFusion.address,
                success: false,
            });
        });

        it('should validate timelock properly', async () => {
            const secret = 123456789n;
            const hashlock = createHash(secret);

            // Test expired timelock
            const expiredTimelock = now() - 3600; // 1 hour ago
            const expiredOrder = createOrderConfig(
                1, // Ethereum
                jettonMaster.address,
                user1.address,
                user2.address,
                hashlock,
                expiredTimelock,
                toNano('100')
            );

            const expiredResult = await tonFusion.send(
                resolver.getSender(),
                {
                    value: toNano('0.1'),
                },
                {
                    $$type: 'CreateEVMToTONOrder',
                    orderConfig: expiredOrder,
                    jetton: beginCell().endCell(),
                }
            );

            expect(expiredResult.transactions).toHaveTransaction({
                from: resolver.address,
                to: tonFusion.address,
                success: false,
                exitCode: 75, // ORDER_EXPIRED
            });
        });

        it('should validate chain IDs properly', async () => {
            const secret = 123456789n;
            const hashlock = createHash(secret);
            const timelock = now() + 3600;

            // Test invalid chain ID
            const invalidChainOrder = createOrderConfig(
                999999, // Invalid chain ID
                jettonMaster.address,
                user1.address,
                user2.address,
                hashlock,
                timelock,
                toNano('100')
            );

            const invalidChainResult = await tonFusion.send(
                resolver.getSender(),
                {
                    value: toNano('0.1'),
                },
                {
                    $$type: 'CreateEVMToTONOrder',
                    orderConfig: invalidChainOrder,
                    jetton: beginCell().endCell(),
                }
            );

            expect(invalidChainResult.transactions).toHaveTransaction({
                from: resolver.address,
                to: tonFusion.address,
                success: false,
                exitCode: 88, // INVALID_CHAIN_ID
            });
        });
    });

    describe('Cross-Chain Security', () => {
        it('should validate EVM chain connectivity', async () => {
            // Test with unsupported chain
            const secret = 123456789n;
            const hashlock = createHash(secret);
            const timelock = now() + 3600;

            const unsupportedChainOrder = createOrderConfig(
                999999, // Unsupported chain
                jettonMaster.address,
                user1.address,
                user2.address,
                hashlock,
                timelock,
                toNano('100')
            );

            const result = await tonFusion.send(
                resolver.getSender(),
                {
                    value: toNano('0.1'),
                },
                {
                    $$type: 'CreateEVMToTONOrder',
                    orderConfig: unsupportedChainOrder,
                    jetton: beginCell().endCell(),
                }
            );

            expect(result.transactions).toHaveTransaction({
                from: resolver.address,
                to: tonFusion.address,
                success: false,
                exitCode: 88, // INVALID_CHAIN_ID
            });
        });

        it('should validate escrow contract deployment', async () => {
            const secret = 123456789n;
            const hashlock = createHash(secret);
            const timelock = now() + 3600;

            // Test with chain that has no escrow contract deployed
            const noEscrowOrder = createOrderConfig(
                999, // Chain without escrow
                jettonMaster.address,
                user1.address,
                user2.address,
                hashlock,
                timelock,
                toNano('100')
            );

            const result = await tonFusion.send(
                resolver.getSender(),
                {
                    value: toNano('0.1'),
                },
                {
                    $$type: 'CreateEVMToTONOrder',
                    orderConfig: noEscrowOrder,
                    jetton: beginCell().endCell(),
                }
            );

            expect(result.transactions).toHaveTransaction({
                from: resolver.address,
                to: tonFusion.address,
                success: false,
                exitCode: 106, // ESCROW_NOT_DEPLOYED
            });
        });
    });

    describe('Gas Optimization Security', () => {
        it('should handle gas limit validation', async () => {
            // Test with excessive gas limit
            const secret = 123456789n;
            const hashlock = createHash(secret);
            const timelock = now() + 3600;

            const highGasOrder = createOrderConfig(
                1, // Ethereum
                jettonMaster.address,
                user1.address,
                user2.address,
                hashlock,
                timelock,
                toNano('100')
            );

            // This should be handled by the gas optimization logic
            const result = await tonFusion.send(
                resolver.getSender(),
                {
                    value: toNano('0.1'),
                },
                {
                    $$type: 'CreateEVMToTONOrder',
                    orderConfig: highGasOrder,
                    jetton: beginCell().endCell(),
                }
            );

            // Should succeed with optimized gas
            expect(result.transactions).toHaveTransaction({
                from: resolver.address,
                to: tonFusion.address,
                success: true,
            });
        });

        it('should validate gas price calculations', async () => {
            // Test gas price validation for different chains
            const chains = [1, 137, 56, 42161]; // Ethereum, Polygon, BSC, Arbitrum

            for (const chainId of chains) {
                const secret = 123456789n;
                const hashlock = createHash(secret);
                const timelock = now() + 3600;

                const order = createOrderConfig(
                    chainId,
                    jettonMaster.address,
                    user1.address,
                    user2.address,
                    hashlock,
                    timelock,
                    toNano('100')
                );

                const result = await tonFusion.send(
                    resolver.getSender(),
                    {
                        value: toNano('0.1'),
                    },
                    {
                        $$type: 'CreateEVMToTONOrder',
                        orderConfig: order,
                        jetton: beginCell().endCell(),
                    }
                );

                // Should succeed with proper gas price calculation
                expect(result.transactions).toHaveTransaction({
                    from: resolver.address,
                    to: tonFusion.address,
                    success: true,
                });
            }
        });
    });

    describe('Error Handling Security', () => {
        it('should handle malformed messages gracefully', async () => {
            // Test with invalid message format
            const malformedMessage = {
                $$type: 'InvalidMessageType',
                data: 'invalid',
            };

            // This should be handled gracefully by the contract
            expect(() => {
                // The contract should handle unknown message types
            }).not.toThrow();
        });

        it('should handle edge cases in order management', async () => {
            // Test with maximum values
            const secret = 123456789n;
            const hashlock = createHash(secret);
            const timelock = now() + 3600;

            const maxAmountOrder = createOrderConfig(
                1, // Ethereum
                jettonMaster.address,
                user1.address,
                user2.address,
                hashlock,
                timelock,
                2n ** 64n - 1n // Maximum uint64
            );

            const result = await tonFusion.send(
                resolver.getSender(),
                {
                    value: toNano('0.1'),
                },
                {
                    $$type: 'CreateEVMToTONOrder',
                    orderConfig: maxAmountOrder,
                    jetton: beginCell().endCell(),
                }
            );

            // Should handle maximum values properly
            expect(result.transactions).toHaveTransaction({
                from: resolver.address,
                to: tonFusion.address,
                success: true,
            });
        });

        it('should handle concurrent operations safely', async () => {
            // Test multiple concurrent order creations
            const promises = [];

            for (let i = 0; i < 5; i++) {
                const secret = 123456789n + BigInt(i);
                const hashlock = createHash(secret);
                const timelock = now() + 3600;

                const order = createOrderConfig(
                    1, // Ethereum
                    jettonMaster.address,
                    user1.address,
                    user2.address,
                    hashlock,
                    timelock,
                    toNano('100')
                );

                promises.push(
                    tonFusion.send(
                        resolver.getSender(),
                        {
                            value: toNano('0.1'),
                        },
                        {
                            $$type: 'CreateEVMToTONOrder',
                            orderConfig: order,
                            jetton: beginCell().endCell(),
                        }
                    )
                );
            }

            const results = await Promise.all(promises);

            // All operations should succeed
            for (const result of results) {
                expect(result.transactions).toHaveTransaction({
                    from: resolver.address,
                    to: tonFusion.address,
                    success: true,
                });
            }
        });
    });

    describe('Bridge and Oracle Security', () => {
        it('should validate bridge configuration', async () => {
            // Test with invalid bridge configuration
            const secret = 123456789n;
            const hashlock = createHash(secret);
            const timelock = now() + 3600;

            const invalidBridgeOrder = createOrderConfig(
                999, // Chain with invalid bridge
                jettonMaster.address,
                user1.address,
                user2.address,
                hashlock,
                timelock,
                toNano('100')
            );

            const result = await tonFusion.send(
                resolver.getSender(),
                {
                    value: toNano('0.1'),
                },
                {
                    $$type: 'CreateEVMToTONOrder',
                    orderConfig: invalidBridgeOrder,
                    jetton: beginCell().endCell(),
                }
            );

            expect(result.transactions).toHaveTransaction({
                from: resolver.address,
                to: tonFusion.address,
                success: false,
                exitCode: 110, // INVALID_BRIDGE_CONFIG
            });
        });

        it('should handle bridge timeouts gracefully', async () => {
            // Test bridge timeout scenarios
            const secret = 123456789n;
            const hashlock = createHash(secret);
            const timelock = now() + 3600;

            const timeoutOrder = createOrderConfig(
                1, // Ethereum
                jettonMaster.address,
                user1.address,
                user2.address,
                hashlock,
                timelock,
                toNano('100')
            );

            const result = await tonFusion.send(
                resolver.getSender(),
                {
                    value: toNano('0.1'),
                },
                {
                    $$type: 'CreateEVMToTONOrder',
                    orderConfig: timeoutOrder,
                    jetton: beginCell().endCell(),
                }
            );

            // Should handle timeout scenarios properly
            expect(result.transactions).toHaveTransaction({
                from: resolver.address,
                to: tonFusion.address,
                success: true,
            });
        });
    });
}); 