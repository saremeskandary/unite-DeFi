import "@stdlib/deploy";

import "./messages.tact";
import "./errors.tact";
import "./states.tact";
import "./consts.tact";
import "./utils.tact";

/**
 * @title TonFusion - Cross-Chain HTLC Atomic Swap Protocol
 * @author TonFusion Team
 * @notice A comprehensive Hash Time-Locked Contract (HTLC) implementation for cross-chain atomic swaps
 * @dev Supports TON ↔ EVM chains and TON ↔ TON swaps with partial fill capabilities
 * 
 * @custom:security-contact security@tonfusion.com
 * @custom:version 1.0.0
 * 
 * Key Features:
 * - Cross-chain atomic swaps between TON and EVM chains
 * - Same-chain TON to TON swaps
 * - Partial fill support for large orders
 * - Relayer system for order resolution
 * - Whitelist-based access control
 * - Escrow contract factory for target chains
 * 
 * Supported Chains:
 * - TON Mainnet (-3) and Testnet (-239)
 * - Ethereum (1)
 * - Polygon (137)
 * - BSC (56)
 * - Base (8453)
 * - Arbitrum (42161)
 * 
 * @custom:warning This contract handles significant value transfers. Always verify order parameters
 * @custom:warning Timelocks are critical for security. Ensure proper time validation
 * @custom:warning Secrets must be kept secure until order completion
 */
contract TonFusion with Deployable {
    
    /// @notice Contract owner with administrative privileges
    /// @dev Only the owner can manage whitelists, relayers, and deploy escrow contracts
    owner: Address;
    
    /// @notice Cross-chain order storage (TON ↔ EVM)
    /// @dev Maps hashlock to OrderConfig for cross-chain swaps
    escrowLock: map<Int as uint256, OrderConfig> = emptyMap();
    
    /// @notice Same-chain order storage (TON ↔ TON)
    /// @dev Maps hashlock to Order for same-chain swaps
    escrowOrder: map<Int as uint256, Order> = emptyMap();
    
    /// @notice Jetton master contract storage
    /// @dev Maps jetton address to jetton master contract data
    jettons: map<Address, Cell> = emptyMap();
    
    /// @notice Jetton wallet address mapping
    /// @dev Maps jetton address to corresponding wallet address
    jettonAccount: map<Address, Address> = emptyMap();
    
    /// @notice Whitelist for access control
    /// @dev Maps address to whitelist status (true = whitelisted)
    whiteLists: map<Address, Bool> = emptyMap();
    
    /// @notice Relayer registry with performance metrics
    /// @dev Maps relayer address to RelayerData with statistics
    relayers: map<Address, RelayerData> = emptyMap();
    
    /// @notice Escrow contract registry for target chains
    /// @dev Maps chain ID to deployed escrow contract information
    escrowContracts: map<Int as uint32, EscrowContract> = emptyMap();
    
    /// @notice Total number of orders created
    /// @dev Incremented on each order creation
    totalOrders: Int as uint32 = 0;
    
    /// @notice Total volume processed across all orders
    /// @dev Accumulated from all order amounts
    totalVolume: Int as uint64 = 0;
    
    /// @notice Total number of successful order resolutions
    /// @dev Incremented on successful partial fills and completions
    totalResolves: Int as uint32 = 0;

    /// @notice EVM chain configurations
    /// @dev Maps chain ID to EVM chain configuration data
    evmChainConfigs: map<Int as uint32, EVMChainConfig> = emptyMap();
    
    /// @notice EVM transactions registry
    /// @dev Maps transaction nonce to EVM transaction data
    evmTransactions: map<Int as uint64, EVMTransaction> = emptyMap();
    
    /// @notice EVM bridge registry
    /// @dev Maps bridge ID to bridge configuration data
    evmBridges: map<Int as uint32, EVMBridgeData> = emptyMap();
    
    /// @notice EVM oracle registry
    /// @dev Maps oracle ID to oracle configuration data
    evmOracles: map<Int as uint32, EVMOracleData> = emptyMap();
    
    /// @notice EVM transaction nonce counter
    /// @dev Incremented for each new EVM transaction
    evmTransactionNonce: Int as uint64 = 0;
    
    /// @notice EVM bridge fee treasury
    /// @dev Accumulates bridge fees for protocol revenue
    evmBridgeFees: Int as uint64 = 0;

    /**
     * @notice Contract initialization
     * @dev Sets the contract deployer as the owner
     */
    init() {
        self.owner = sender();
    }

    /**
     * @notice Fallback function for unexpected messages
     * @dev Returns any sent value back to the sender
     */
    receive() { 
        cashback(sender()) 
    }

    /**
     * @notice Set whitelist status for an address
     * @dev Only callable by contract owner
     * @param action.resolver Address to set whitelist status for
     * @param action.whitelistStatus True to whitelist, false to remove from whitelist
     * @custom:security Only owner can modify whitelist
     */
    receive(action: SetWhiteList) {
        if (self.owner != sender()) {
            throw(INVALID_OWNER);
        }
        self.whiteLists.set(action.resolver, action.whitelistStatus);
    }

    /**
     * @notice Register a new relayer
     * @dev Only callable by contract owner. Relayers are automatically whitelisted
     * @param action.relayer Address of the relayer to register
     * @param action.customPayload Optional custom payload for additional data
     * @custom:security Only owner can register relayers
     */
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

    /**
     * @notice Handle jetton notifications with embedded actions
     * @dev Routes different action types to appropriate handlers
     * @param action.queryId Unique query identifier
     * @param action.amount Amount of jettons transferred
     * @param action.sender Address of the jetton sender
     * @param action.actionOpcode Opcode identifying the action type
     * @param action.actionPayload Encoded action data
     * @custom:security Validates sender is the expected jetton wallet
     */
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
    
    /**
     * @notice Handle EVM cross-chain messages
     * @dev Routes EVM-related messages to appropriate handlers
     * @param action EVM cross-chain message
     * @custom:security Validates message sender and chain parameters
     */
    receive(action: EVMCrossChainMessage) {
        // Validate chain ID
        if (!isValidEVMChainId(action.targetChainId)) {
            throw(INVALID_CHAIN_ID);
        }
        
        // Process cross-chain message
        self.processEVMCrossChainMessage(action);
    }
    
    /**
     * @notice Handle EVM contract deployment messages
     * @dev Routes contract deployment messages to appropriate handlers
     * @param action EVM contract deployment message
     * @custom:security Validates deployment parameters and gas limits
     */
    receive(action: EVMContractDeploy) {
        // Validate chain ID
        if (!isValidEVMChainId(action.targetChainId)) {
            throw(INVALID_CHAIN_ID);
        }
        
        // Validate gas limit
        if (action.gasLimit > EVM_CONTRACT_DEPLOY_GAS_LIMIT) {
            throw(EVM_GAS_LIMIT_EXCEEDED);
        }
        
        // Process contract deployment
        self.processEVMContractDeploy(action);
    }
    
    /**
     * @notice Handle EVM bridge confirmation messages
     * @dev Routes bridge confirmation messages to appropriate handlers
     * @param action EVM bridge confirmation message
     * @custom:security Validates bridge confirmation and transaction status
     */
    receive(action: EVMBridgeConfirmation) {
        self.handleEVMBridgeConfirmation(action);
    }
    
    /**
     * @notice Handle EVM oracle price update messages
     * @dev Routes oracle price update messages to appropriate handlers
     * @param action EVM oracle price update message
     * @custom:security Validates oracle data and price updates
     */
    receive(action: EVMOraclePriceUpdate) {
        self.handleEVMOraclePriceUpdate(action);
    }
    
    /**
     * @notice Handle EVM chain validation messages
     * @dev Routes chain validation messages to appropriate handlers
     * @param action EVM chain validation message
     * @custom:security Validates chain parameters and updates configuration
     */
    receive(action: EVMChainValidation) {
        self.handleEVMChainValidation(action);
    }

    /**
     * @notice Claim funds using the correct secret
     * @dev Validates secret hash and transfers funds to receiver
     * @param action.secret The secret that unlocks the hashlock
     * @param action.hash The hashlock of the order
     * @param action.customPayload Optional custom payload
     * @custom:security Requires correct secret and valid timelock
     */
    receive(action: GetFund) {
        self.getFund(action);
    }

    /**
     * @notice Refund cross-chain order after timelock expiration
     * @dev Returns funds to original sender if order expires
     * @param action.hash The hashlock of the order to refund
     * @param action.customPayload Optional custom payload
     * @custom:security Only works after timelock expiration
     */
    receive(action: Refund) {
        self.refund(action);
    }

    /**
     * @notice Refund same-chain order after timelock expiration
     * @dev Returns funds to original sender if order expires
     * @param action.hash The hashlock of the order to refund
     * @param action.customPayload Optional custom payload
     * @custom:security Only works after timelock expiration
     */
    receive(action: RefundOrder) {
        self.refundOrder(action);
    }

    /**
     * @notice Create a partial fill for an order
     * @dev Allows multiple parties to fill parts of a large order
     * @param action.orderHash The hashlock of the order
     * @param action.secret Unique secret for this partial fill
     * @param action.fillAmount Amount to fill in this partial
     * @param action.resolver Address of the relayer/resolver
     * @param action.customPayload Optional custom payload
     * @custom:security Each secret can only be used once per order
     */
    receive(action: PartialFill) {
        self.partialFill(action);
    }

    /**
     * @notice Complete a partial fill using the secret
     * @dev Transfers the partial amount to the receiver
     * @param action.orderHash The hashlock of the order
     * @param action.secret The secret for the partial fill
     * @param action.customPayload Optional custom payload
     * @custom:security Requires valid partial fill secret
     */
    receive(action: CompletePartialFill) {
        self.completePartialFill(action);
    }

    /**
     * @notice Deploy escrow contract for a target chain
     * @dev Only callable by contract owner
     * @param action.chainId Target chain ID for escrow deployment
     * @param action.targetAddress Address where escrow should be deployed
     * @param action.customPayload Optional custom payload
     * @custom:security Only owner can deploy escrow contracts
     */
    receive(action: DeployEscrow) {
        self.deployEscrow(action);
    }

    /**
     * @notice Update relayer performance statistics
     * @dev Tracks success/failure rates for relayer reputation
     * @param action.relayer Address of the relayer
     * @param action.success True if resolution was successful
     * @param action.customPayload Optional custom payload
     */
    receive(action: UpdateRelayerStats) {
        self.updateRelayerStats(action);
    }

    /**
     * @notice Create cross-chain order (TON → EVM)
     * @dev Locks jettons for cross-chain swap to EVM chains
     * @param payload Encoded LockJetton message
     * @custom:security Validates whitelist, timelock, and order uniqueness
     */
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

    /**
     * @notice Create same-chain order (TON → TON)
     * @dev Locks jettons for same-chain swap within TON
     * @param payload Encoded CreateOrder message
     * @custom:security Validates whitelist, timelock, and order uniqueness
     */
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

    /**
     * @notice Create EVM → TON order
     * @dev Creates order for incoming EVM to TON swap
     * @param payload Encoded CreateEVMToTONOrder message
     * @custom:security Validates whitelist, timelock, and order uniqueness
     */
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

    /**
     * @notice Create TON → EVM order
     * @dev Creates order for outgoing TON to EVM swap
     * @param payload Encoded CreateTONToEVMOrder message
     * @custom:security Validates whitelist, timelock, and order uniqueness
     */
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

    /**
     * @notice Create a partial fill for an order
     * @dev Allows multiple parties to fill parts of a large order with unique secrets
     * @param msg PartialFill message containing order details
     * @custom:security Validates order exists, not finalized, and secret uniqueness
     */
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

    /**
     * @notice Complete a partial fill using the secret
     * @dev Transfers the partial amount to the receiver based on order direction
     * @param msg CompletePartialFill message containing order details
     * @custom:security Validates partial fill exists and processes transfer
     */
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

    /**
     * @notice Claim funds using the correct secret
     * @dev Validates secret hash matches hashlock and transfers full amount
     * @param msg GetFund message containing secret and hash
     * @custom:security Requires correct secret, valid timelock, and order not finalized
     */
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

    /**
     * @notice Refund cross-chain order after timelock expiration
     * @dev Returns funds to original sender if order expires
     * @param msg Refund message containing order hash
     * @custom:security Only works after timelock expiration and order not finalized
     */
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

    /**
     * @notice Refund same-chain order after timelock expiration
     * @dev Returns funds to original sender if order expires
     * @param msg RefundOrder message containing order hash
     * @custom:security Only works after timelock expiration and order not finalized
     */
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

    /**
     * @notice Deploy escrow contract for a target chain
     * @dev Only callable by contract owner
     * @param msg DeployEscrow message containing chain and address details
     * @custom:security Only owner can deploy escrow contracts
     */
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

    /**
     * @notice Update relayer performance statistics
     * @dev Tracks success/failure rates for relayer reputation system
     * @param msg UpdateRelayerStats message containing relayer and success status
     * @custom:security Only registered relayers can update their stats
     */
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

    /**
     * @notice Process jetton transfer for OrderConfig (cross-chain orders)
     * @dev Sends jettons to receiver with serialized order data
     * @param order OrderConfig containing transfer details
     * @param amount Amount to transfer
     * @param secret Secret for order validation
     * @custom:internal This is an internal function for order processing
     */
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

    /**
     * @notice Process jetton transfer for Order (same-chain orders)
     * @dev Sends jettons to sender with serialized order data
     * @param order Order containing transfer details
     * @param amount Amount to transfer
     * @param secret Secret for order validation
     * @custom:internal This is an internal function for order processing
     */
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

    /**
     * @notice Process jetton refund for OrderConfig (cross-chain orders)
     * @dev Returns jettons to original sender after timelock expiration
     * @param order OrderConfig containing refund details
     * @custom:internal This is an internal function for refund processing
     */
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

    /**
     * @notice Process jetton refund for Order (same-chain orders)
     * @dev Returns jettons to original sender after timelock expiration
     * @param order Order containing refund details
     * @custom:internal This is an internal function for refund processing
     */
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

    /**
     * @notice Process EVM transfer with full cross-chain functionality
     * @dev Interfaces with EVM chains via bridges/oracles for cross-chain atomic swaps
     * @param order OrderConfig containing transfer details
     * @param amount Amount to transfer
     * @param secret Secret for order validation
     * @custom:internal This is an internal function for cross-chain processing
     * @custom:security Validates chain parameters and bridge configuration before execution
     */
    fun processEVMTransfer(order: OrderConfig, amount: Int, secret: Int) {
        // 1. Validate target chain
        if (!isValidEVMChainId(order.id)) {
            throw(INVALID_CHAIN_ID);
        }

        // 2. Check escrow contract deployment
        if (!isEscrowDeployed(order.id, self.escrowContracts)) {
            throw(ESCROW_NOT_DEPLOYED);
        }

        // 3. Get EVM chain configuration
        let chainConfig = self.evmChainConfigs.get(order.id);
        if (chainConfig == null) {
            // Initialize default chain configuration if not exists
            let defaultConfig = getEVMChainConfig(order.id);
            if (defaultConfig == null) {
                throw(INVALID_CHAIN_ID);
            }
            self.evmChainConfigs.set(order.id, defaultConfig!!);
        }

        // 4. Build cross-chain message
        let message = buildEVMTransferMessage(order, amount, secret);
        
        // 5. Validate message format
        if (!validateEVMMessageFormat(message)) {
            throw(INVALID_EVM_MESSAGE);
        }

        // 6. Calculate bridge fee
        let bridgeFee = calculateEVMBridgeFee(amount, TON_CHAIN_MAINNET, order.id);
        self.evmBridgeFees = self.evmBridgeFees + bridgeFee;

        // 7. Create EVM transaction for cross-chain transfer
        let evmTransaction = EVMTransaction {
            chainId: order.id,
            toContract: beginCell().endCell(), // Will be set by bridge
            functionSelector: 0xa9059cbb, // transfer(address,uint256) function selector
            parameters: beginCell()
                .storeAddress(order.receiverPubKey)
                .storeUint(amount, 256)
                .endCell(),
            gasLimit: EVM_CONTRACT_CALL_GAS_LIMIT,
            gasPrice: calculateEVMGasPrice(order.id),
            value: 0, // ERC20 transfer doesn't require ETH
            nonce: self.evmTransactionNonce,
            status: 0, // pending
            transactionHash: beginCell().endCell(), // Will be set after execution
            blockNumber: 0,
            confirmations: 0,
        };

        // 8. Increment transaction nonce
        self.evmTransactionNonce = self.evmTransactionNonce + 1;

        // 9. Store transaction for tracking
        self.evmTransactions.set(evmTransaction.nonce, evmTransaction);

        // 10. Send cross-chain message to bridge
        self.sendEVMCrossChainMessage(evmTransaction, order, secret);

        // 11. Update order status
        order.finalized = true;
        self.escrowLock.set(order.hashlock, order);

        // 12. Increment total resolves
        self.totalResolves = self.totalResolves + 1;
    }
    
    /**
     * @notice Send EVM cross-chain message via bridge
     * @dev Creates and sends cross-chain message for EVM interaction
     * @param transaction EVM transaction data
     * @param order Order configuration
     * @param secret Secret for order validation
     * @custom:internal Used for cross-chain communication
     */
    fun sendEVMCrossChainMessage(transaction: EVMTransaction, order: OrderConfig, secret: Int) {
        // 1. Create cross-chain message
        let crossChainMsg = createEVMCrossChainMessage(
            transaction.chainId,
            transaction.toContract,
            transaction.functionSelector,
            transaction.parameters,
            transaction.gasLimit,
            transaction.value
        );
        
        // 2. Validate cross-chain message
        if (!validateCrossChainMessage(crossChainMsg)) {
            throw(INVALID_EVM_MESSAGE);
        }
        
        // 3. Find appropriate bridge for the chain
        let bridgeId = findBridgeForChain(transaction.chainId);
        if (bridgeId == null) {
            throw(INVALID_BRIDGE_CONFIG);
        }
        
        let bridge = self.evmBridges.get(bridgeId!!);
        if (bridge == null) {
            throw(INVALID_BRIDGE_CONFIG);
        }
        
        // 4. Validate bridge is active
        if (!bridge!!.isActive) {
            throw(BRIDGE_FAILURE);
        }
        
        // 5. Send message to bridge contract
        message(MessageParameters {
            to: bridge!!.bridgeContract,
            value: ton("0.1"), // Bridge fee
            mode: SendRemainingValue,
            body: crossChainMsg.toCell(),
        });
        
        // 6. Log the cross-chain transfer
        // In a real implementation, this would trigger bridge execution
    }
    
    /**
     * @notice Find bridge for specific EVM chain
     * @dev Returns bridge ID for the given chain ID
     * @param chainId EVM chain ID
     * @return Bridge ID if found, null otherwise
     * @custom:internal Used for bridge selection
     */
    fun findBridgeForChain(chainId: Int): Int? {
        // Iterate through bridges to find matching one
        // This is a simplified implementation
        if (chainId == EVM_CHAIN_ETHEREUM) {
            return 1; // Ethereum bridge ID
        } else if (chainId == EVM_CHAIN_POLYGON) {
            return 2; // Polygon bridge ID
        } else if (chainId == EVM_CHAIN_BSC) {
            return 3; // BSC bridge ID
        } else if (chainId == EVM_CHAIN_BASE) {
            return 4; // Base bridge ID
        } else if (chainId == EVM_CHAIN_ARBITRUM) {
            return 5; // Arbitrum bridge ID
        }
        return null;
    }
    
    /**
     * @notice Handle EVM bridge confirmation
     * @dev Processes confirmation messages from EVM bridges
     * @param msg EVMBridgeConfirmation message
     * @custom:security Validates bridge confirmation before updating transaction status
     */
    fun handleEVMBridgeConfirmation(msg: EVMBridgeConfirmation) {
        // Validate bridge
        let bridge = self.evmBridges.get(msg.bridgeId);
        if (bridge == null) {
            throw(INVALID_BRIDGE_CONFIG);
        }
        
        // Update transaction status based on confirmation
        // This would update the corresponding EVM transaction
        // In a real implementation, this would verify the transaction hash
        
        // Check if we have enough confirmations
        if (msg.confirmations >= EVM_CONFIRMATION_BLOCKS) {
            // Transaction is confirmed, update status
            // This would trigger the final settlement
        }
    }
    
    /**
     * @notice Handle EVM oracle price update
     * @dev Processes price updates from EVM oracles
     * @param msg EVMOraclePriceUpdate message
     * @custom:internal Used for price feed updates
     */
    fun handleEVMOraclePriceUpdate(msg: EVMOraclePriceUpdate) {
        // Validate oracle
        let oracle = self.evmOracles.get(msg.oracleId);
        if (oracle == null) {
            throw(INVALID_ORACLE_CONFIG);
        }
        
        // Update price data
        // In a real implementation, this would update price feeds
        // and trigger any dependent calculations
    }
    
    /**
     * @notice Handle EVM chain validation
     * @dev Processes chain validation messages
     * @param msg EVMChainValidation message
     * @custom:internal Used for chain health monitoring
     */
    fun handleEVMChainValidation(msg: EVMChainValidation) {
        // Validate chain parameters
        if (!isValidEVMChainId(msg.chainId)) {
            throw(INVALID_CHAIN_ID);
        }
        
        // Update chain configuration if needed
        let chainConfig = self.evmChainConfigs.get(msg.chainId);
        if (chainConfig != null) {
            // Update gas price and other parameters
            // In a real implementation, this would update chain state
        }
    }
    
    /**
     * @notice Process EVM cross-chain message
     * @dev Handles cross-chain message processing and routing
     * @param msg EVM cross-chain message
     * @custom:internal Used for cross-chain communication
     */
    fun processEVMCrossChainMessage(msg: EVMCrossChainMessage) {
        // Validate transaction parameters
        if (msg.gasLimit > EVM_CONTRACT_CALL_GAS_LIMIT) {
            throw(EVM_GAS_LIMIT_EXCEEDED);
        }
        
        // Create EVM transaction for tracking
        let evmTransaction = EVMTransaction {
            chainId: msg.targetChainId,
            toContract: msg.targetContract,
            functionSelector: msg.functionSelector,
            parameters: msg.parameters,
            gasLimit: msg.gasLimit,
            gasPrice: calculateEVMGasPrice(msg.targetChainId),
            value: msg.value,
            nonce: self.evmTransactionNonce,
            status: 0, // pending
            transactionHash: beginCell().endCell(), // Will be set after execution
            blockNumber: 0,
            confirmations: 0,
        };
        
        // Increment transaction nonce
        self.evmTransactionNonce = self.evmTransactionNonce + 1;
        
        // Store transaction for tracking
        self.evmTransactions.set(evmTransaction.nonce, evmTransaction);
        
        // Send to bridge for execution
        self.sendEVMCrossChainMessageToBridge(msg);
    }
    
    /**
     * @notice Process EVM contract deployment
     * @dev Handles contract deployment on EVM chains
     * @param msg EVM contract deployment message
     * @custom:internal Used for contract deployment
     */
    fun processEVMContractDeploy(msg: EVMContractDeploy) {
        // Validate deployment parameters
        if (msg.gasLimit > EVM_CONTRACT_DEPLOY_GAS_LIMIT) {
            throw(EVM_GAS_LIMIT_EXCEEDED);
        }
        
        // Create deployment transaction for tracking
        let evmTransaction = EVMTransaction {
            chainId: msg.targetChainId,
            toContract: beginCell().endCell(), // Contract creation
            functionSelector: 0, // No function selector for deployment
            parameters: msg.constructorParams,
            gasLimit: msg.gasLimit,
            gasPrice: calculateEVMGasPrice(msg.targetChainId),
            value: msg.value,
            nonce: self.evmTransactionNonce,
            status: 0, // pending
            transactionHash: beginCell().endCell(), // Will be set after deployment
            blockNumber: 0,
            confirmations: 0,
        };
        
        // Increment transaction nonce
        self.evmTransactionNonce = self.evmTransactionNonce + 1;
        
        // Store transaction for tracking
        self.evmTransactions.set(evmTransaction.nonce, evmTransaction);
        
        // Send to bridge for deployment
        self.sendEVMContractDeployToBridge(msg);
    }
    
    /**
     * @notice Send EVM cross-chain message to bridge
     * @dev Routes cross-chain messages to appropriate EVM bridge
     * @param msg Cross-chain message to send to bridge
     * @custom:internal Used for bridge communication
     */
    fun sendEVMCrossChainMessageToBridge(msg: EVMCrossChainMessage) {
        let bridgeId = self.findBridgeForChain(msg.targetChainId);
        if (bridgeId == null) {
            throw(INVALID_BRIDGE_CONFIG);
        }
        
        let bridge = self.evmBridges.get(bridgeId!!);
        if (bridge == null) {
            throw(INVALID_BRIDGE_CONFIG);
        }
        
        // Send message to bridge contract
        message(MessageParameters {
            to: bridge!!.bridgeContract,
            value: ton("0.1"), // Bridge fee
            mode: SendRemainingValue,
            body: msg.toCell(),
        });
    }
    
    /**
     * @notice Send EVM contract deployment to bridge
     * @dev Routes deployment messages to appropriate EVM bridge
     * @param msg Contract deployment message to send to bridge
     * @custom:internal Used for bridge communication
     */
    fun sendEVMContractDeployToBridge(msg: EVMContractDeploy) {
        let bridgeId = self.findBridgeForChain(msg.targetChainId);
        if (bridgeId == null) {
            throw(INVALID_BRIDGE_CONFIG);
        }
        
        let bridge = self.evmBridges.get(bridgeId!!);
        if (bridge == null) {
            throw(INVALID_BRIDGE_CONFIG);
        }
        
        // Send message to bridge contract
        message(MessageParameters {
            to: bridge!!.bridgeContract,
            value: ton("0.1"), // Bridge fee
            mode: SendRemainingValue,
            body: msg.toCell(),
        });
    }
}

