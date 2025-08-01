import "@stdlib/deploy";

import "./messages.tact";
import "./errors.tact";
import "./states.tact";
import "./consts.tact";
import "./utils.tact";

contract TonFusion with Deployable {
    
    owner: Address;
    
    // Order storage
    escrowLock: map<Int as uint256, OrderConfig> = emptyMap(); // Cross-chain orders
    escrowOrder: map<Int as uint256, Order> = emptyMap(); // Same-chain orders
    
    // Jetton management
    jettons: map<Address, Cell> = emptyMap();
    jettonAccount: map<Address, Address> = emptyMap();
    
    // Access control
    whiteLists: map<Address, Bool> = emptyMap();
    relayers: map<Address, RelayerData> = emptyMap();
    
    // Escrow factory
    escrowContracts: map<Int as uint32, EscrowContract> = emptyMap();
    
    // Statistics
    totalOrders: Int as uint32 = 0;
    totalVolume: Int as uint64 = 0;
    totalResolves: Int as uint32 = 0;

    init() {
        self.owner = sender();
    }

    receive() { 
        cashback(sender()) 
    }

    // Whitelist management
    receive(action: SetWhiteList) {
        if (self.owner != sender()) {
            throw(INVALID_OWNER);
        }
        self.whiteLists.set(action.resolver, action.whitelistStatus);
    }

    // Relayer management
    receive(action: RegisterRelayer) {
        if (self.owner != sender()) {
            throw(INVALID_OWNER);
        }
        
        let relayerData = RelayerData {
            address: action.relayer,
            whitelisted: true,
            totalResolves: 0,
            successRate: 0,
        };
        
        self.relayers.set(action.relayer, relayerData);
    }

    // Jetton notifications with actions
    receive(action: JettonNotifyWithActionRequest) {
        if (action.actionOpcode == LockJetton.opcode()) {
            let msg = LockJetton.fromCell(action.actionPayload);
            let wallet: Address = calculateJettonWalletAddress(action.sender, msg.orderConfig.srcJettonAddress, msg.jetton);
            
            if (wallet == sender()) {
                self.create(action.actionPayload);
            } else {
                cashback(sender());
                throw(INVALID_OWNER);
            }
        } else if (action.actionOpcode == CreateOrder.opcode()) {
            let msg = CreateOrder.fromCell(action.actionPayload);
            let wallet: Address = calculateJettonWalletAddress(action.sender, msg.orderConfig.srcJettonAddress, msg.jetton);
            
            if (wallet == sender()) {
                self.makeOrder(action.actionPayload);
            } else {
                cashback(sender());
                throw(INVALID_OWNER);
            }
        } else if (action.actionOpcode == CreateEVMToTONOrder.opcode()) {
            let msg = CreateEVMToTONOrder.fromCell(action.actionPayload);
            self.createEVMToTONOrder(action.actionPayload);
        } else if (action.actionOpcode == CreateTONToEVMOrder.opcode()) {
            let msg = CreateTONToEVMOrder.fromCell(action.actionPayload);
            self.createTONToEVMOrder(action.actionPayload);
        } else {
            cashback(sender());
        }
    }

    // Fund management
    receive(action: GetFund) {
        self.getFund(action);
    }

    receive(action: Refund) {
        self.refund(action);
    }

    receive(action: RefundOrder) {
        self.refundOrder(action);
    }

    // Partial fill management
    receive(action: PartialFill) {
        self.partialFill(action);
    }

    receive(action: CompletePartialFill) {
        self.completePartialFill(action);
    }

    // Escrow factory
    receive(action: DeployEscrow) {
        self.deployEscrow(action);
    }

    // Relayer stats update
    receive(action: UpdateRelayerStats) {
        self.updateRelayerStats(action);
    }

    // Create cross-chain order (TON → EVM)
    fun create(payload: Cell) {
        let msg = LockJetton.fromCell(payload);

        if (self.whiteLists.get(sender()) == true) {
            throw(INVALID_WHITELIST);
        }

        if (now() >= msg.orderConfig.timelock) {
            throw(ORDER_EXPIRED);
        }

        if (self.escrowLock.get(msg.orderConfig.hashlock) != null) {
            throw(ORDER_ALREADY_EXISTS);
        }

        // Set direction
        msg.orderConfig.direction = TON_TO_EVM;

        self.jettons.set(msg.orderConfig.srcJettonAddress, msg.jetton);
        self.jettonAccount.set(msg.orderConfig.srcJettonAddress, sender());
        self.escrowLock.set(msg.orderConfig.hashlock, msg.orderConfig);
        
        self.totalOrders = self.totalOrders + 1;
        self.totalVolume = self.totalVolume + msg.orderConfig.amount;
    }

    // Create same-chain order (TON → TON)
    fun makeOrder(payload: Cell) {
        let msg = CreateOrder.fromCell(payload);

        if (self.whiteLists.get(sender()) == true) {
            throw(INVALID_WHITELIST);
        }

        if (now() >= msg.orderConfig.timelock) {
            throw(ORDER_EXPIRED);
        }

        if (self.escrowOrder.get(msg.orderConfig.hashlock) != null) {
            throw(ORDER_ALREADY_EXISTS);
        }

        // Set direction
        msg.orderConfig.direction = TON_TO_TON;

        self.jettons.set(msg.orderConfig.srcJettonAddress, msg.jetton);
        self.jettonAccount.set(msg.orderConfig.srcJettonAddress, sender());
        self.escrowOrder.set(msg.orderConfig.hashlock, msg.orderConfig);
        
        self.totalOrders = self.totalOrders + 1;
        self.totalVolume = self.totalVolume + msg.orderConfig.amount;
    }

    // Create EVM → TON order
    fun createEVMToTONOrder(payload: Cell) {
        let msg = CreateEVMToTONOrder.fromCell(payload);

        if (self.whiteLists.get(sender()) == true) {
            throw(INVALID_WHITELIST);
        }

        if (now() >= msg.orderConfig.timelock) {
            throw(ORDER_EXPIRED);
        }

        if (self.escrowLock.get(msg.orderConfig.hashlock) != null) {
            throw(ORDER_ALREADY_EXISTS);
        }

        // Set direction
        msg.orderConfig.direction = EVM_TO_TON;

        self.escrowLock.set(msg.orderConfig.hashlock, msg.orderConfig);
        
        self.totalOrders = self.totalOrders + 1;
        self.totalVolume = self.totalVolume + msg.orderConfig.amount;
    }

    // Create TON → EVM order
    fun createTONToEVMOrder(payload: Cell) {
        let msg = CreateTONToEVMOrder.fromCell(payload);

        if (self.whiteLists.get(sender()) == true) {
            throw(INVALID_WHITELIST);
        }

        if (now() >= msg.orderConfig.timelock) {
            throw(ORDER_EXPIRED);
        }

        if (self.escrowLock.get(msg.orderConfig.hashlock) != null) {
            throw(ORDER_ALREADY_EXISTS);
        }

        // Set direction
        msg.orderConfig.direction = TON_TO_EVM;

        self.escrowLock.set(msg.orderConfig.hashlock, msg.orderConfig);
        
        self.totalOrders = self.totalOrders + 1;
        self.totalVolume = self.totalVolume + msg.orderConfig.amount;
    }

    // Partial fill functionality
    fun partialFill(msg: PartialFill) {
        let orderConfigData = self.escrowLock.get(msg.orderHash);
        if (orderConfigData != null) {
            let order = orderConfigData!!;
            if (order.finalized) {
                throw(ORDER_ALREADY_FINALIZED);
            }
            if (msg.fillAmount > order.amount - order.totalFilled) {
                throw(PARTIAL_FILL_EXCEEDS_ORDER);
            }
            if (order.partialFills.get(msg.secret) != null) {
                throw(SECRET_ALREADY_USED);
            }
            order.partialFills.set(msg.secret, msg.fillAmount);
            order.totalFilled = order.totalFilled + msg.fillAmount;
            let relayerData = self.relayers.get(msg.resolver);
            if (relayerData != null) {
                let updatedRelayer = RelayerData{
                    address: relayerData!!.address,
                    whitelisted: relayerData!!.whitelisted,
                    totalResolves: relayerData!!.totalResolves + 1,
                    successRate: relayerData!!.successRate
                };
                self.relayers.set(msg.resolver, updatedRelayer);
            }
            self.totalResolves = self.totalResolves + 1;
            return;
        }
        let orderData = self.escrowOrder.get(msg.orderHash);
        if (orderData != null) {
            let order = orderData!!;
            if (order.finalized) {
                throw(ORDER_ALREADY_FINALIZED);
            }
            if (msg.fillAmount > order.amount - order.totalFilled) {
                throw(PARTIAL_FILL_EXCEEDS_ORDER);
            }
            if (order.partialFills.get(msg.secret) != null) {
                throw(SECRET_ALREADY_USED);
            }
            order.partialFills.set(msg.secret, msg.fillAmount);
            order.totalFilled = order.totalFilled + msg.fillAmount;
            let relayerData = self.relayers.get(msg.resolver);
            if (relayerData != null) {
                let updatedRelayer = RelayerData{
                    address: relayerData!!.address,
                    whitelisted: relayerData!!.whitelisted,
                    totalResolves: relayerData!!.totalResolves + 1,
                    successRate: relayerData!!.successRate
                };
                self.relayers.set(msg.resolver, updatedRelayer);
            }
            self.totalResolves = self.totalResolves + 1;
            return;
        }
        throw(INVALID_HASH);
    }

    // Complete partial fill
    fun completePartialFill(msg: CompletePartialFill) {
        let orderConfigData = self.escrowLock.get(msg.orderHash);
        if (orderConfigData != null) {
            let order = orderConfigData!!;
            let fillAmount = order.partialFills.get(msg.secret);
            if (fillAmount == null) {
                throw(ORDER_NOT_PARTIALLY_FILLED);
            }
            if (order.direction == TON_TO_EVM || order.direction == TON_TO_TON) {
                self.processJettonTransfer(order, fillAmount!!, msg.secret);
            } else {
                self.processEVMTransfer(order, fillAmount!!, msg.secret);
            }
            return;
        }
        let orderData = self.escrowOrder.get(msg.orderHash);
        if (orderData != null) {
            let order = orderData!!;
            let fillAmount = order.partialFills.get(msg.secret);
            if (fillAmount == null) {
                throw(ORDER_NOT_PARTIALLY_FILLED);
            }
            // Only TON_TO_TON is possible for Order
            self.processJettonTransferOrder(order, fillAmount!!, msg.secret);
            return;
        }
        throw(INVALID_HASH);
    }

    // Get fund with secret
    fun getFund(msg: GetFund) {
        let data = self.escrowLock.get(msg.hash);
        if (data == null) {
            throw(INVALID_HASH);
        }
        
        let order = data!!;
        let secretHash = keccakBytes32(msg.secret);
        
        if (now() > order.timelock) {
            throw(ORDER_EXPIRED);
        }
        
        if (order.finalized) {
            throw(ORDER_ALREADY_FINALIZED);
        }
        
        if (secretHash != order.hashlock) {
            throw(INVALID_SECRET);
        }
        
        order.finalized = true;
        self.processJettonTransfer(order, order.amount, msg.secret);
    }

    // Refund cross-chain order
    fun refund(msg: Refund) {
        let data = self.escrowLock.get(msg.hash);
        if (data == null) {
            throw(INVALID_HASH);
        }
        
        let order = data!!;
        
        if (now() < order.timelock) {
            throw(ORDER_NOT_EXPIRED);
        }
        
        if (order.finalized) {
            throw(ORDER_ALREADY_FINALIZED);
        }
        
        order.finalized = true;
        self.processJettonRefund(order);
    }

    // Refund same-chain order
    fun refundOrder(msg: RefundOrder) {
        let data = self.escrowOrder.get(msg.hash);
        if (data == null) {
            throw(INVALID_HASH);
        }
        let order = data!!;
        if (now() < order.timelock) {
            throw(ORDER_NOT_EXPIRED);
        }
        if (order.finalized) {
            throw(ORDER_ALREADY_FINALIZED);
        }
        order.finalized = true;
        self.processJettonRefundOrder(order);
    }

    // Deploy escrow contract
    fun deployEscrow(msg: DeployEscrow) {
        if (self.owner != sender()) {
            throw(INVALID_OWNER);
        }
        
        let escrowContract = EscrowContract {
            chainId: msg.chainId,
            contractAddress: msg.targetAddress,
            deployed: true,
            totalOrders: 0,
        };
        
        self.escrowContracts.set(msg.chainId, escrowContract);
    }

    // Update relayer statistics
    fun updateRelayerStats(msg: UpdateRelayerStats) {
        let relayerData = self.relayers.get(msg.relayer);
        if (relayerData == null) {
            throw(INVALID_RELAYER);
        }
        let newTotalResolves = relayerData!!.totalResolves + 1;
        let newSuccessRate = relayerData!!.successRate;
        if (msg.success) {
            newSuccessRate = min(relayerData!!.successRate + 1, 100);
        } else {
            newSuccessRate = max(relayerData!!.successRate - 1, 0);
        }
        let updatedRelayer = RelayerData{
            address: relayerData!!.address,
            whitelisted: relayerData!!.whitelisted,
            totalResolves: newTotalResolves,
            successRate: newSuccessRate
        };
        self.relayers.set(msg.relayer, updatedRelayer);
    }

    // Process jetton transfer for OrderConfig
    fun processJettonTransfer(order: OrderConfig, amount: Int, secret: Int) {
        let jettonWallet = self.jettonAccount.get(order.srcJettonAddress);
        let ctx = context();
        let remainingValue = ctx.value - priceOfJettonForward(ctx.readForwardFee(), 1);
        remainingValue = min(remainingValue, 0);
        message(MessageParameters {
            to: jettonWallet!!,
            value: 0,
            mode: SendRemainingValue,
            body: SendViaJettonTransfer {
                queryId: 0,
                amount: amount,
                responseDestination: order.receiverPubKey,
                destination: order.receiverPubKey,
                forwardTonAmount: remainingValue,
                forwardPayload: beginCell().storeRef(serializeOrderConfig(order, secret)).endCell().beginParse(),
                customPayload: null,
            }.toCell(),
        });
    }

    // Process jetton transfer for Order (TON_TO_TON)
    fun processJettonTransferOrder(order: Order, amount: Int, secret: Int) {
        let jettonWallet = self.jettonAccount.get(order.srcJettonAddress);
        let ctx = context();
        let remainingValue = ctx.value - priceOfJettonForward(ctx.readForwardFee(), 1);
        remainingValue = min(remainingValue, 0);
        message(MessageParameters {
            to: jettonWallet!!,
            value: 0,
            mode: SendRemainingValue,
            body: SendViaJettonTransfer {
                queryId: 0,
                amount: amount,
                responseDestination: order.senderPubKey,
                destination: order.senderPubKey,
                forwardTonAmount: remainingValue,
                forwardPayload: beginCell().storeRef(serializeOrder(order, secret)).endCell().beginParse(),
                customPayload: null,
            }.toCell(),
        });
    }

    // Process jetton refund for OrderConfig
    fun processJettonRefund(order: OrderConfig) {
        let jettonWallet = self.jettonAccount.get(order.srcJettonAddress);
        let ctx = context();
        let remainingValue = ctx.value - priceOfJettonForward(ctx.readForwardFee(), 1);
        remainingValue = min(remainingValue, 0);
        message(MessageParameters {
            to: jettonWallet!!,
            value: 0,
            mode: SendRemainingValue,
            body: SendViaJettonTransfer {
                queryId: 0,
                amount: order.amount,
                responseDestination: order.senderPubKey,
                destination: order.senderPubKey,
                forwardTonAmount: remainingValue,
                forwardPayload: beginCell().storeRef(serializeOrderConfig(order, 0)).endCell().beginParse(),
                customPayload: null,
            }.toCell(),
        });
    }

    // Process jetton refund for Order (TON_TO_TON)
    fun processJettonRefundOrder(order: Order) {
        let jettonWallet = self.jettonAccount.get(order.srcJettonAddress);
        let ctx = context();
        let remainingValue = ctx.value - priceOfJettonForward(ctx.readForwardFee(), 1);
        remainingValue = min(remainingValue, 0);
        message(MessageParameters {
            to: jettonWallet!!,
            value: 0,
            mode: SendRemainingValue,
            body: SendViaJettonTransfer {
                queryId: 0,
                amount: order.amount,
                responseDestination: order.senderPubKey,
                destination: order.senderPubKey,
                forwardTonAmount: remainingValue,
                forwardPayload: beginCell().storeRef(serializeOrder(order, 0)).endCell().beginParse(),
                customPayload: null,
            }.toCell(),
        });
    }

    // Process EVM transfer (placeholder for cross-chain functionality)
    fun processEVMTransfer(order: OrderConfig, amount: Int, secret: Int) {
        // This would interface with EVM chains via oracles/bridges
        // For now, just log the transfer
    }
}

