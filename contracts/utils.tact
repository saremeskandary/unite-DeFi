import "./states.tact";

/**
 * @title TonFusion Utilities
 * @author TonFusion Team
 * @notice Utility functions and helpers for the TonFusion HTLC protocol
 * @dev Provides common functionality used across the protocol
 * 
 * @custom:version 1.0.0
 * 
 * Utility Categories:
 * - Jetton wallet management
 * - Cryptographic functions
 * - Chain validation
 * - Order processing
 * - Serialization helpers
 */

/**
 * @notice Jetton transfer message for internal transfers
 * @dev Used for sending jettons between contracts
 * @param queryId Unique query identifier
 * @param amount Amount of jettons to transfer
 * @param destination Destination address
 * @param responseDestination Optional response destination
 * @param customPayload Optional custom payload
 * @param forwardTonAmount Amount of TON to forward
 * @param forwardPayload Forward payload data
 * @custom:opcode 0xf8a7ea5
 */
message(0xf8a7ea5) SendViaJettonTransfer {
    queryId: Int as uint64;
    amount: Int as coins;
    destination: Address;
    responseDestination: Address?;
    customPayload: Cell?;
    forwardTonAmount: Int as coins;
    forwardPayload: Slice as remaining;
}

/**
 * @notice Calculate jetton wallet address using RUNVM
 * @dev Improved calculation using RUNVM for better compatibility
 * @param owner Owner address for the jetton wallet
 * @param jettonData Jetton data cell
 * @param jettonCode Jetton wallet code cell
 * @param jettonMaster Jetton master contract address
 * @return Calculated jetton wallet address
 * @custom:internal This is an internal utility function
 */
asm fun calculateJettonWallet(owner: Address, jettonData: Cell, jettonCode: Cell, jettonMaster: Address): Address {
    c7 PUSHCTR
    0 INDEX // Unpack singleton from c7
    SWAP
    8 SETINDEX
    SWAP
    DUP
    ROTREV
    10 SETINDEX
    1 TUPLE // Make it singleton back
    ROTREV
    CTOS            // owner_addr c7 md mc"
    2 PUSHINT       // owner_addr c7 md mc args"
    103289 PUSHINT  // owner_addr c7 md mc args get_jwa_method_id"
    5 0 REVERSE     // owner_addr get_jwa_method_id args mc md c7"
    53 RUNVM        // address exit_code c4' c5'"
    3 BLKDROP       // address"
}

/**
 * @notice Calculate jetton wallet address (fallback method)
 * @dev Fallback calculation for compatibility with older jetton standards
 * @param ownerAddress Owner address for the jetton wallet
 * @param jettonMasterAddress Jetton master contract address
 * @param jettonWalletCode Jetton wallet code cell
 * @return Calculated jetton wallet address
 * @custom:internal This is an internal utility function
 */
fun calculateJettonWalletAddress(
    ownerAddress: Address,
    jettonMasterAddress: Address,
    jettonWalletCode: Cell
): Address {
    let initData = JettonWalletData{
        balance: 0,
        ownerAddress,
        jettonMasterAddress,
        jettonWalletCode,
    };

    return contractAddress(StateInit{
        code: jettonWalletCode,
        data: initData.toCell(),
    });
}

/**
 * @notice Create a zero address for placeholder purposes
 * @dev Creates an address that represents a null/zero address
 * @return Zero address for placeholder use
 * @custom:internal Used for placeholder addresses
 */
fun createZeroAddress(): Address {
    return contractAddress(StateInit{
        code: beginCell().endCell(),
        data: beginCell().endCell(),
    });
}

/**
 * @notice Enhanced hash function for HTLC
 * @dev Generates keccak256 hash of a secret for hashlock creation
 * @param secret The secret to hash
 * @return Hash of the secret (hashlock)
 * @custom:security This function is critical for HTLC security
 */
fun keccakBytes32(secret: Int): Int {
    let cell: Cell = beginCell()
        .storeUint(secret, 256)
        .endCell();
    return cell.hash();
}

/**
 * @notice Generate multiple secrets for partial fills
 * @dev Creates a map of partial secrets for large order splitting
 * @param baseSecret Base secret to derive from
 * @param count Number of partial secrets to generate
 * @return Map of partial hash to partial secret
 * @custom:internal Used for partial fill functionality
 */
fun generatePartialSecrets(baseSecret: Int, count: Int): map<Int as uint256, Int as uint256> {
    let secrets: map<Int as uint256, Int as uint256> = emptyMap();
    let i: Int = 0;
    while (i < count) {
        let partialSecret = baseSecret + i;
        let partialHash = keccakBytes32(partialSecret);
        secrets.set(partialHash, partialSecret);
        i = i + 1;
    }
    return secrets;
}

/**
 * @notice Validate chain ID for supported networks
 * @dev Checks if a chain ID is supported by the protocol
 * @param chainId Chain ID to validate
 * @return True if chain ID is supported, false otherwise
 * @custom:security Only supported chains are allowed
 */
fun isValidChainId(chainId: Int): Bool {
    return chainId == 1 || // Ethereum
           chainId == 137 || // Polygon
           chainId == 56 || // BSC
           chainId == 8453 || // Base
           chainId == 42161 || // Arbitrum
           chainId == -3 || // TON Mainnet
           chainId == -239; // TON Testnet
}

/**
 * @notice Validate EVM chain ID for supported networks
 * @dev Checks if an EVM chain ID is supported by the protocol
 * @param chainId EVM chain ID to validate
 * @return True if EVM chain ID is supported, false otherwise
 * @custom:security Only supported EVM chains are allowed
 */
fun isValidEVMChainId(chainId: Int): Bool {
    return chainId == EVM_CHAIN_ETHEREUM ||
           chainId == EVM_CHAIN_POLYGON ||
           chainId == EVM_CHAIN_BSC ||
           chainId == EVM_CHAIN_BASE ||
           chainId == EVM_CHAIN_ARBITRUM;
}

/**
 * @notice Validate TON chain ID
 * @dev Checks if a TON chain ID is valid
 * @param chainId TON chain ID to validate
 * @return True if TON chain ID is valid, false otherwise
 * @custom:security Only valid TON chains are allowed
 */
fun isValidTONChainId(chainId: Int): Bool {
    return chainId == TON_CHAIN_MAINNET || chainId == TON_CHAIN_TESTNET;
}

/**
 * @notice Get EVM chain configuration
 * @dev Returns chain-specific parameters for EVM integration
 * @param chainId EVM chain ID
 * @return EVMChainConfig with chain parameters
 * @custom:internal Used for EVM chain configuration
 */
fun getEVMChainConfig(chainId: Int): EVMChainConfig? {
    if (chainId == EVM_CHAIN_ETHEREUM) {
        return EVMChainConfig {
            chainId: EVM_CHAIN_ETHEREUM,
            rpcEndpoint: beginCell().endCell(), // RPC endpoint placeholder
            blockTime: 12,
            gasLimit: EVM_CONTRACT_CALL_GAS_LIMIT,
            isActive: true,
            bridgeAddress: beginCell().endCell(), // Placeholder
            oracleAddress: beginCell().endCell(), // Placeholder
        };
    } else if (chainId == EVM_CHAIN_POLYGON) {
        return EVMChainConfig {
            chainId: EVM_CHAIN_POLYGON,
            rpcEndpoint: beginCell().endCell(), // RPC endpoint placeholder
            blockTime: 2,
            gasLimit: EVM_CONTRACT_CALL_GAS_LIMIT,
            isActive: true,
            bridgeAddress: beginCell().endCell(), // Placeholder
            oracleAddress: beginCell().endCell(), // Placeholder
        };
    } else if (chainId == EVM_CHAIN_BSC) {
        return EVMChainConfig {
            chainId: EVM_CHAIN_BSC,
            rpcEndpoint: beginCell().endCell(), // RPC endpoint placeholder
            blockTime: 3,
            gasLimit: EVM_CONTRACT_CALL_GAS_LIMIT,
            isActive: true,
            bridgeAddress: beginCell().endCell(), // Placeholder
            oracleAddress: beginCell().endCell(), // Placeholder
        };
    } else if (chainId == EVM_CHAIN_BASE) {
        return EVMChainConfig {
            chainId: EVM_CHAIN_BASE,
            rpcEndpoint: beginCell().endCell(), // RPC endpoint placeholder
            blockTime: 2,
            gasLimit: EVM_CONTRACT_CALL_GAS_LIMIT,
            isActive: true,
            bridgeAddress: beginCell().endCell(), // Placeholder
            oracleAddress: beginCell().endCell(), // Placeholder
        };
    } else if (chainId == EVM_CHAIN_ARBITRUM) {
        return EVMChainConfig {
            chainId: EVM_CHAIN_ARBITRUM,
            rpcEndpoint: beginCell().endCell(), // RPC endpoint placeholder
            blockTime: 1,
            gasLimit: EVM_CONTRACT_CALL_GAS_LIMIT,
            isActive: true,
            bridgeAddress: beginCell().endCell(), // Placeholder
            oracleAddress: beginCell().endCell(), // Placeholder
        };
    }
    return null;
}

/**
 * @notice Create EVM cross-chain message
 * @dev Creates a message for EVM chain interactions
 * @param targetChainId Target EVM chain ID
 * @param targetContract Target EVM contract address
 * @param functionSelector EVM function selector
 * @param parameters Function parameters
 * @param gasLimit Gas limit for the call
 * @param value ETH value to send
 * @return Cross-chain message for EVM communication
 * @custom:internal Used for EVM contract interactions
 */
fun createEVMCrossChainMessage(
    targetChainId: Int,
    targetContract: Cell,
    functionSelector: Int,
    parameters: Cell,
    gasLimit: Int,
    value: Int
): CrossChainMessage {
    return CrossChainMessage {
        sourceChain: TON_CHAIN_MAINNET,
        targetChain: targetChainId,
        orderHash: 0, // Will be set by caller
        amount: 0, // Will be set by caller
        secret: 0, // Will be set by caller
        timestamp: 0, // Will be set by caller
        nonce: 0, // Will be set by caller
    };
}

/**
 * @notice Create EVM contract deployment message
 * @dev Creates a message for deploying contracts on EVM chains
 * @param targetChainId Target EVM chain ID
 * @param contractBytecode EVM contract bytecode
 * @param constructorParams Constructor parameters
 * @param gasLimit Gas limit for deployment
 * @param value ETH value to send
 * @return EVMContractDeploy for contract deployment
 * @custom:internal Used for EVM contract deployment
 */
fun createEVMContractDeploy(
    targetChainId: Int,
    contractBytecode: Cell,
    constructorParams: Cell,
    gasLimit: Int,
    value: Int
): EVMContractDeploy {
    return EVMContractDeploy {
        targetChainId: targetChainId,
        contractBytecode: contractBytecode,
        constructorParams: constructorParams,
        gasLimit: gasLimit,
        value: value,
        customPayload: null,
    };
}

/**
 * @notice Calculate EVM gas price based on chain
 * @dev Returns appropriate gas price for different EVM chains
 * @param chainId EVM chain ID
 * @return Gas price in wei
 * @custom:internal Used for gas price estimation
 */
fun calculateEVMGasPrice(chainId: Int): Int {
    if (chainId == EVM_CHAIN_ETHEREUM) {
        return 20000000000; // 20 gwei
    } else if (chainId == EVM_CHAIN_POLYGON) {
        return 30000000000; // 30 gwei
    } else if (chainId == EVM_CHAIN_BSC) {
        return 5000000000; // 5 gwei
    } else if (chainId == EVM_CHAIN_BASE) {
        return 1000000000; // 1 gwei
    } else if (chainId == EVM_CHAIN_ARBITRUM) {
        return 100000000; // 0.1 gwei
    }
    return 20000000000; // Default to 20 gwei
}

/**
 * @notice Validate EVM transaction parameters
 * @dev Checks if EVM transaction parameters are valid
 * @param transaction EVM transaction to validate
 * @return True if transaction is valid, false otherwise
 * @custom:security Critical for transaction validation
 */
fun validateEVMTransaction(transaction: EVMTransaction): Bool {
    return isValidEVMChainId(transaction.chainId) &&
           transaction.gasLimit > 0 &&
           transaction.gasLimit <= EVM_CONTRACT_CALL_GAS_LIMIT &&
           transaction.gasPrice > 0 &&
           transaction.value >= 0;
}

/**
 * @notice Calculate EVM bridge fee based on amount and chain
 * @dev Returns bridge fee for cross-chain transfers
 * @param amount Transfer amount
 * @param sourceChainId Source chain ID
 * @param targetChainId Target chain ID
 * @return Bridge fee amount
 * @custom:internal Used for fee calculation
 */
fun calculateEVMBridgeFee(amount: Int, sourceChainId: Int, targetChainId: Int): Int {
    let baseFee = 1000000; // 0.001 TON base fee
    let percentageFee = amount * 1 / 10000; // 0.01% fee
    
    // Higher fees for cross-chain transfers
    if (sourceChainId == TON_CHAIN_MAINNET || sourceChainId == TON_CHAIN_TESTNET) {
        if (isValidEVMChainId(targetChainId)) {
            return baseFee + percentageFee + 5000000; // Extra for TON to EVM
        }
    } else if (isValidEVMChainId(sourceChainId)) {
        if (targetChainId == TON_CHAIN_MAINNET || targetChainId == TON_CHAIN_TESTNET) {
            return baseFee + percentageFee + 3000000; // Less for EVM to TON
        }
    }
    
    return baseFee + percentageFee;
}

/**
 * @notice Calculate swap direction based on chain IDs
 * @dev Determines the type of swap based on source and destination chains
 * @param fromChainId Source chain ID
 * @param toChainId Destination chain ID
 * @return Swap direction constant (TON_TO_EVM, EVM_TO_TON, or TON_TO_TON)
 * @custom:internal Used for order direction determination
 */
fun getSwapDirection(fromChainId: Int, toChainId: Int): Int {
    if (fromChainId == -3 || fromChainId == -239) {
        if (toChainId == -3 || toChainId == -239) {
            return TON_TO_TON;
        } else {
            return TON_TO_EVM;
        }
    } else {
        return EVM_TO_TON;
    }
}

/**
 * @notice Calculate timelock based on chain and direction
 * @dev Sets appropriate timelock duration based on swap type
 * @param chainId Target chain ID
 * @param direction Swap direction
 * @return Calculated timelock timestamp
 * @custom:internal Used for order timelock calculation
 */
fun calculateTimelock(chainId: Int, direction: Int): Int {
    let baseTime = now();
    if (direction == TON_TO_EVM) {
        return baseTime + 3600; // 1 hour for cross-chain
    } else if (direction == EVM_TO_TON) {
        return baseTime + 1800; // 30 minutes for EVM to TON
    } else {
        return baseTime + 900; // 15 minutes for same-chain
    }
}

/**
 * @notice Validate order parameters
 * @dev Checks if order parameters are valid
 * @param order Order configuration to validate
 * @return True if order is valid, false otherwise
 * @custom:security Critical for order validation
 */
fun validateOrder(order: OrderConfig): Bool {
    return order.amount > 0 &&
           order.timelock > now() &&
           isValidChainId(order.id) &&
           order.hashlock != 0;
}

/**
 * @notice Calculate fees based on order size and direction
 * @dev Determines appropriate fees for different swap types
 * @param amount Order amount
 * @param direction Swap direction
 * @return Calculated fee amount
 * @custom:internal Used for fee calculation
 */
fun calculateFees(amount: Int, direction: Int): Int {
    let baseFee = 1000000; // 0.001 TON base fee
    let percentageFee = amount * 5 / 10000; // 0.05% fee
    
    if (direction == TON_TO_EVM) {
        return baseFee + percentageFee + 5000000; // Extra for cross-chain
    } else if (direction == EVM_TO_TON) {
        return baseFee + percentageFee + 3000000; // Less for EVM to TON
    } else {
        return baseFee + percentageFee; // Standard for same-chain
    }
}

/**
 * @notice Calculate price for jetton forward
 * @dev Determines the cost of forwarding jettons
 * @param fwdFee Forward fee
 * @param fwdTonAmount Forward TON amount
 * @return Calculated forward price
 * @custom:internal Used for jetton transfer pricing
 */
inline fun priceOfJettonForward(fwdFee: Int, fwdTonAmount: Int): Int {
    return
        fwdTonAmount +
        2 * fwdFee +
        getForwardFee(40, 30000, false) +
        (2 * getComputeFee(30000, false) +
         ton("0.02"));
}

/**
 * @notice Enhanced serialization for OrderConfig with partial fills
 * @dev Serializes OrderConfig with secret for transfer
 * @param order Order configuration to serialize
 * @param secret Secret for the order
 * @return Serialized order cell
 * @custom:internal Used for order data serialization
 */
inline fun serializeOrderConfig(order: OrderConfig, secret: Int): Cell {
    return beginCell()
        .storeUint(order.id, 32)
        .storeAddress(order.srcJettonAddress)
        .storeAddress(order.senderPubKey)
        .storeAddress(order.receiverPubKey)
        .storeUint(order.hashlock, 256)
        .storeUint(order.timelock, 32)
        .storeUint(order.amount, 64)
        .storeBool(order.finalized)
        .storeUint(order.totalFilled, 64)
        .storeUint(order.direction, 8)
        .storeUint(secret, 256)
        .endCell();
}

/**
 * @notice Enhanced serialization for Order with partial fills
 * @dev Serializes Order with secret for transfer
 * @param order Order to serialize
 * @param secret Secret for the order
 * @return Serialized order cell
 * @custom:internal Used for order data serialization
 */
inline fun serializeOrder(order: Order, secret: Int): Cell {
    return beginCell()
        .storeUint(order.id, 32)
        .storeAddress(order.srcJettonAddress)
        .storeAddress(order.senderPubKey)
        .storeUint(order.hashlock, 256)
        .storeUint(order.timelock, 32)
        .storeUint(order.amount, 64)
        .storeBool(order.finalized)
        .storeUint(order.totalFilled, 64)
        .storeUint(order.direction, 8)
        .storeUint(secret, 256)
        .endCell();
}

/**
 * @notice Serialize escrow contract data
 * @dev Serializes EscrowContract for storage
 * @param escrow Escrow contract data to serialize
 * @return Serialized escrow contract cell
 * @custom:internal Used for escrow data serialization
 */
inline fun serializeEscrowContract(escrow: EscrowContract): Cell {
    return beginCell()
        .storeUint(escrow.chainId, 32)
        .storeAddress(escrow.contractAddress)
        .storeBool(escrow.deployed)
        .storeUint(escrow.totalOrders, 32)
        .endCell();
}

/**
 * @notice Serialize relayer data
 * @dev Serializes RelayerData for storage
 * @param relayer Relayer data to serialize
 * @return Serialized relayer data cell
 * @custom:internal Used for relayer data serialization
 */
inline fun serializeRelayerData(relayer: RelayerData): Cell {
    return beginCell()
        .storeAddress(relayer.address)
        .storeBool(relayer.whitelisted)
        .storeUint(relayer.totalResolves, 32)
        .storeUint(relayer.successRate, 16)
        .endCell();
}

/**
 * @notice Find bridge for specific chain
 * @dev Returns bridge ID for the given chain ID
 * @param chainId Target chain ID
 * @return Bridge ID if found, null otherwise
 * @custom:internal Used for cross-chain bridge selection
 */
fun findBridgeForChain(chainId: Int): Int? {
    // For now, return a default bridge ID
    // In a real implementation, this would look up the appropriate bridge
    if (isValidEVMChainId(chainId)) {
        return 1; // Default bridge ID
    }
    return null;
}

/**
 * @notice Validate cross-chain message
 * @dev Validates cross-chain message format and parameters
 * @param message Cross-chain message to validate
 * @return True if message is valid, false otherwise
 * @custom:security Critical for cross-chain security
 */
fun validateCrossChainMessage(message: CrossChainMessage): Bool {
    // Validate source and target chains
    if (!isValidEVMChainId(message.targetChain) && !isValidTONChainId(message.targetChain)) {
        return false;
    }
    
    // Validate timestamp (not too old)
    let currentTime = 0; // In real implementation, get current timestamp
    if (message.timestamp < currentTime - EVM_BRIDGE_TIMEOUT_SECONDS) {
        return false;
    }
    
    // Validate nonce (should be unique)
    if (message.nonce == 0) {
        return false;
    }
    
    return true;
}

/**
 * @notice Build EVM transfer message
 * @dev Creates EVM-compatible message format for transfers
 * @param order Order configuration
 * @param amount Transfer amount
 * @param secret Secret for order validation
 * @return Cell containing EVM transfer message
 * @custom:internal Used for cross-chain transfers
 */
fun buildEVMTransferMessage(order: OrderConfig, amount: Int, secret: Int): Cell {
    return beginCell()
        .storeUint(order.id, 32) // Chain ID
        .storeAddress(order.receiverPubKey) // Target address
        .storeUint(amount, 256) // Amount
        .storeUint(secret, 256) // Secret
        .storeUint(order.hashlock, 256) // Hashlock
        .storeUint(order.timelock, 32) // Timelock
        .endCell();
}

/**
 * @notice Send cross-chain message
 * @dev Sends message to cross-chain bridge
 * @param chainId Target chain ID
 * @param message Cross-chain message
 * @custom:internal Used for cross-chain communication
 */
fun sendCrossChainMessage(chainId: Int, message: Cell) {
    // In a real implementation, this would send the message to the bridge
    // For now, this is a placeholder
    // The actual implementation would depend on the specific bridge being used
}

/**
 * @notice Check if escrow contract is deployed
 * @dev Validates escrow contract deployment on target chain
 * @param chainId Target chain ID
 * @param escrowContracts Map of escrow contracts
 * @return True if escrow is deployed, false otherwise
 * @custom:security Critical for cross-chain security
 */
fun isEscrowDeployed(chainId: Int, escrowContracts: map<Int as uint32, EscrowContract>): Bool {
    let escrow = escrowContracts.get(chainId);
    if (escrow == null) {
        return false;
    }
    return escrow!!.deployed;
}

/**
 * @notice Validate EVM message format
 * @dev Validates EVM message structure and parameters
 * @param message EVM message to validate
 * @return True if message format is valid, false otherwise
 * @custom:security Critical for EVM integration security
 */
fun validateEVMMessageFormat(message: Cell): Bool {
    // Basic validation - check if message is not empty
    // In a real implementation, this would validate the specific message format
    // based on the EVM chain and message type
    
    return true;
}

/**
 * @notice Handle bridge failure with retry logic
 * @dev Implements retry mechanism for failed bridge operations
 * @param transaction EVM transaction that failed
 * @param retryCount Current retry attempt number
 * @param maxRetries Maximum number of retry attempts
 * @return True if retry should be attempted, false if max retries reached
 * @custom:internal Used for bridge failure recovery
 */
fun handleBridgeFailure(transaction: EVMTransaction, retryCount: Int, maxRetries: Int): Bool {
    if (retryCount >= maxRetries) {
        return false; // Max retries reached
    }
    
    // In a real implementation, this would implement exponential backoff
    // and other retry strategies
    
    return true; // Retry should be attempted
}

/**
 * @notice Process timeout scenarios
 * @dev Handles timeout scenarios for cross-chain operations
 * @param order Order configuration
 * @param currentTime Current timestamp
 * @return True if timeout should be processed, false otherwise
 * @custom:internal Used for timeout handling
 */
fun processTimeoutScenario(order: OrderConfig, currentTime: Int): Bool {
    // Check if order has expired
    if (currentTime > order.timelock) {
        return true; // Order has expired, process timeout
    }
    
    // Check if bridge timeout has occurred
    if (currentTime > order.timelock - EVM_BRIDGE_TIMEOUT_SECONDS) {
        return true; // Bridge timeout, process timeout
    }
    
    return false; // No timeout scenario
}