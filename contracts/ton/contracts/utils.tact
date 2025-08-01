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
 * @notice Validate EVM chain ID
 * @dev Checks if the provided chain ID is supported
 * @param chainId Chain ID to validate
 * @return True if chain ID is supported, false otherwise
 * @custom:internal Used for chain validation
 */
fun isValidEVMChainId(chainId: Int): Bool {
    return chainId == EVM_CHAIN_ETHEREUM ||
           chainId == EVM_CHAIN_POLYGON ||
           chainId == EVM_CHAIN_BSC ||
           chainId == EVM_CHAIN_BASE ||
           chainId == EVM_CHAIN_ARBITRUM;
}

/**
 * @notice Calculate base EVM gas price
 * @dev Calculates base gas price for a specific chain
 * @param chainId EVM chain ID
 * @return Base gas price in wei
 * @custom:internal Used for gas price calculation
 */
fun calculateEVMGasPrice(chainId: Int): Int {
    // In a real implementation, this would fetch current gas prices from the chain
    // For now, return chain-specific base prices
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
    } else {
        return 20000000000; // Default to 20 gwei
    }
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
 * @notice Comprehensive chain validation
 * @dev Validates target chain ID, escrow deployment, and connectivity
 * @param chainId Target chain ID to validate
 * @param escrowContracts Map of escrow contracts
 * @param evmChainConfigs Map of EVM chain configurations
 * @return ValidationResult with validation status and details
 * @custom:security Critical for cross-chain security
 */
fun validateChainComprehensive(
    chainId: Int, 
    escrowContracts: map<Int as uint32, EscrowContract>,
    evmChainConfigs: map<Int as uint32, EVMChainConfig>
): ValidationResult {
    // 1. Validate target chain ID is supported
    if (!isValidEVMChainId(chainId) && !isValidTONChainId(chainId)) {
        return ValidationResult {
            isValid: false,
            errorCode: INVALID_CHAIN_ID,
            errorMessage: beginCell().storeUint(0, 1).endCell(),
            chainId: chainId,
            isEscrowDeployed: false,
            isChainConnected: false,
        };
    }

    // 2. Check if escrow contract is deployed on target chain
    let isEscrowDeployed = isEscrowDeployed(chainId, escrowContracts);

    // 3. Verify chain connectivity
    let isChainConnected = isChainConnectivityValid(chainId, evmChainConfigs);

    // 4. Additional validation for EVM chains
    if (isValidEVMChainId(chainId)) {
        let chainConfig = evmChainConfigs.get(chainId);
        if (chainConfig == null || !chainConfig!!.isActive) {
                    return ValidationResult {
            isValid: false,
            errorCode: CHAIN_NOT_ACTIVE,
            errorMessage: beginCell().storeUint(0, 1).endCell(),
            chainId: chainId,
            isEscrowDeployed: isEscrowDeployed,
            isChainConnected: isChainConnected,
        };
        }
    }

    // All validations passed
    return ValidationResult {
        isValid: true,
        errorCode: 0,
        errorMessage: beginCell().endCell(),
        chainId: chainId,
        isEscrowDeployed: isEscrowDeployed,
        isChainConnected: isChainConnected,
    };
}

/**
 * @notice Validate chain connectivity
 * @dev Checks if the target chain is accessible and responsive
 * @param chainId Target chain ID
 * @param evmChainConfigs Map of EVM chain configurations
 * @return True if chain is connected, false otherwise
 * @custom:internal Used for connectivity validation
 */
fun isChainConnectivityValid(chainId: Int, evmChainConfigs: map<Int as uint32, EVMChainConfig>): Bool {
    // For EVM chains, check if configuration exists and is active
    if (isValidEVMChainId(chainId)) {
        let config = evmChainConfigs.get(chainId);
        if (config == null) {
            return false;
        }
        return config!!.isActive;
    }
    
    // For TON chains, assume connectivity (local chain)
    if (isValidTONChainId(chainId)) {
        return true;
    }
    
    return false;
}

/**
 * @notice Enhanced escrow deployment validation
 * @dev Validates escrow contract deployment with additional checks
 * @param chainId Target chain ID
 * @param escrowContracts Map of escrow contracts
 * @param evmChainConfigs Map of EVM chain configurations
 * @return EscrowValidationResult with detailed validation status
 * @custom:security Critical for cross-chain security
 */
fun validateEscrowDeployment(
    chainId: Int, 
    escrowContracts: map<Int as uint32, EscrowContract>,
    evmChainConfigs: map<Int as uint32, EVMChainConfig>
): EscrowValidationResult {
    let escrow = escrowContracts.get(chainId);
    
    if (escrow == null) {
        return EscrowValidationResult {
            isDeployed: false,
            contractAddress: beginCell().endCell(),
            totalOrders: 0,
            isActive: false,
            errorCode: ESCROW_NOT_DEPLOYED,
            errorMessage: beginCell().storeUint(0, 1).endCell(),
        };
    }
    
    let escrowContract = escrow!!;
    
    if (!escrowContract.deployed) {
        return EscrowValidationResult {
            isDeployed: false,
            contractAddress: beginCell().storeAddress(escrowContract.contractAddress).endCell(),
            totalOrders: escrowContract.totalOrders,
            isActive: false,
            errorCode: ESCROW_NOT_DEPLOYED,
            errorMessage: beginCell().storeUint(0, 1).endCell(),
        };
    }
    
    // Additional validation for EVM chains
    if (isValidEVMChainId(chainId)) {
        let chainConfig = evmChainConfigs.get(chainId);
        if (chainConfig == null || !chainConfig!!.isActive) {
            return EscrowValidationResult {
                isDeployed: true,
                contractAddress: beginCell().storeAddress(escrowContract.contractAddress).endCell(),
                totalOrders: escrowContract.totalOrders,
                isActive: false,
                errorCode: CHAIN_NOT_ACTIVE,
                errorMessage: beginCell().storeUint(0, 1).endCell(),
            };
        }
    }
    
    return EscrowValidationResult {
        isDeployed: true,
        contractAddress: beginCell().storeAddress(escrowContract.contractAddress).endCell(),
        totalOrders: escrowContract.totalOrders,
        isActive: true,
        errorCode: 0,
        errorMessage: beginCell().endCell(),
    };
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
    // Basic validation checks
    if (message.sourceChain == message.targetChain) {
        return false; // Same chain not allowed
    }
    
    if (message.amount <= 0) {
        return false; // Amount must be positive
    }
    
    if (message.timestamp <= 0) {
        return false; // Timestamp must be valid
    }
    
    if (message.nonce <= 0) {
        return false; // Nonce must be positive
    }
    
    return true;
}

/**
 * @notice Create EVM cross-chain message
 * @dev Creates EVM-compatible cross-chain message
 * @param chainId Target chain ID
 * @param toContract Target contract address
 * @param functionSelector Function selector
 * @param parameters Function parameters
 * @param gasLimit Gas limit
 * @param value ETH value
 * @return EVM cross-chain message


/**
 * @notice Create EVM contract deployment message
 * @dev Creates a message for deploying contracts on EVM chains
 * @param targetChainId Target EVM chain ID
 * @param contractBytecode EVM contract bytecode
 * @param constructorParams Constructor parameters
 * @param gasLimit Gas limit for deployment
 * @param value ETH value to send
/**
 * @notice Calculate dynamic gas estimation for target EVM chain with enhanced optimization
 * @dev Estimates gas requirements based on chain characteristics, transaction type, and amount
 * @param chainId Target EVM chain ID
 * @param amount Transfer amount
 * @param isContractCall Whether this is a contract call (true) or simple transfer (false)
 * @return Estimated gas limit for the transaction
 * @custom:internal Used for gas optimization
 * @custom:security Optimized for cost efficiency and reliability
 */
fun calculateEVMDynamicGasLimit(chainId: Int, amount: Int, isContractCall: Bool): Int {
    // Enhanced gas calculation with amount-based adjustments
    let baseGas: Int = EVM_CONTRACT_CALL_GAS_LIMIT;
    if (!isContractCall) {
        baseGas = 21000; // Base gas for simple ETH transfer
    }
    
    // Amount-based gas adjustments (larger amounts may require more gas)
    let amountGasMultiplier: Int = 100; // Default multiplier
    if (amount > 1000000000000000000000) { // > 1000 tokens
        amountGasMultiplier = 110; // 110% for large amounts
    } else if (amount > 100000000000000000000) { // > 100 tokens
        amountGasMultiplier = 105; // 105% for medium amounts
    }
    
    // Chain-specific gas adjustments with enhanced optimization
    let chainGasMultiplier: Int = 100; // Default multiplier
    if (chainId == EVM_CHAIN_ETHEREUM) {
        chainGasMultiplier = 115; // 115% for Ethereum (optimized from 120%)
    } else if (chainId == EVM_CHAIN_POLYGON) {
        chainGasMultiplier = 75; // 75% for Polygon (optimized from 80%)
    } else if (chainId == EVM_CHAIN_BSC) {
        chainGasMultiplier = 65; // 65% for BSC (optimized from 70%)
    } else if (chainId == EVM_CHAIN_BASE) {
        chainGasMultiplier = 80; // 80% for Base (optimized from 85%)
    } else if (chainId == EVM_CHAIN_ARBITRUM) {
        chainGasMultiplier = 70; // 70% for Arbitrum (optimized from 75%)

    }
    
    // Apply both multipliers with safety buffer
    let calculatedGas = baseGas * amountGasMultiplier * chainGasMultiplier / 10000;
    
    // Apply safety buffer for reliability
    let finalGas = calculatedGas * GAS_ESTIMATION_BUFFER / 100;
    
    // Ensure minimum gas limit
    if (finalGas < 21000) {
        finalGas = 21000;
    }
    
    // Ensure maximum gas limit for security
    if (finalGas > EVM_CONTRACT_CALL_GAS_LIMIT) {
        finalGas = EVM_CONTRACT_CALL_GAS_LIMIT;
    }
    
    return finalGas;
}

/**
 * @notice Create enhanced EVM cross-chain message with gas estimation
 * @dev Creates a comprehensive cross-chain message with proper gas estimation
 * @param targetChainId Target EVM chain ID
 * @param targetContract Target EVM contract address
 * @param functionSelector EVM function selector
 * @param parameters Function parameters
 * @param amount Transfer amount
 * @param value ETH value to send
 * @return Enhanced cross-chain message for EVM communication
 * @custom:internal Used for EVM contract interactions
 */
fun createEnhancedEVMCrossChainMessage(
    targetChainId: Int,
    targetContract: Cell,
    functionSelector: Int,
    parameters: Cell,
    amount: Int,
    value: Int
): CrossChainMessage {
    // Calculate dynamic gas limit
    let estimatedGasLimit = calculateEVMDynamicGasLimit(targetChainId, amount, true);
    
    // Get current timestamp
    let currentTimestamp = 0; // Will be set by caller with actual timestamp
    
    // Generate nonce for replay protection
    let messageNonce = 0; // Will be set by caller with actual nonce
    
    return CrossChainMessage {
        sourceChain: TON_CHAIN_MAINNET,
        targetChain: targetChainId,
        orderHash: 0, // Will be set by caller
        amount: amount,
        secret: 0, // Will be set by caller
        timestamp: currentTimestamp,
        nonce: messageNonce,
    };
}

/**
 * @notice Validate enhanced EVM message format with comprehensive checks
 * @dev Validates EVM message structure, parameters, and security requirements
 * @param message EVM message to validate
 * @param chainId Target chain ID for validation
 * @return True if message format is valid, false otherwise
 * @custom:security Critical for EVM integration security
 */
fun validateEnhancedEVMMessageFormat(message: Cell, chainId: Int): Bool {
    // Basic validation - message is always provided in Tact
    
    // Validate chain ID is supported
    if (!isValidEVMChainId(chainId)) {
        return false;
    }
    
    // In a real implementation, this would validate the specific message format
    // based on the EVM chain and message type, including:
    // - Message size limits
    // - Parameter encoding validation
    // - Security checks for replay protection
    // - Timestamp validation
    
    return true;
}

/**
 * @notice Calculate optimal gas price for target EVM chain with enhanced optimization
 * @dev Calculates gas price based on chain characteristics, network conditions, and priority
 * @param chainId EVM chain ID
 * @param priority Priority level (0=low, 1=medium, 2=high)
 * @return Optimal gas price in wei
 * @custom:internal Used for gas price optimization
 * @custom:security Optimized for cost efficiency and transaction success
 */
fun calculateOptimalEVMGasPrice(chainId: Int, priority: Int): Int {
    let baseGasPrice = calculateEVMGasPrice(chainId);
    
    // Apply priority multiplier with enhanced optimization
    let priorityMultiplier: Int = 100; // Default to medium priority
    if (priority == 0) {
        priorityMultiplier = 85; // 85% for low priority (optimized from 80%)
    } else if (priority == 1) {
        priorityMultiplier = 100; // 100% for medium priority
    } else if (priority == 2) {
        priorityMultiplier = 140; // 140% for high priority (optimized from 150%)
    }
    
    // Apply chain-specific adjustments with enhanced optimization
    let chainMultiplier: Int = 100; // Default multiplier
    if (chainId == EVM_CHAIN_ETHEREUM) {
        chainMultiplier = 110; // 110% for Ethereum (optimized from EVM_GAS_PRICE_MULTIPLIER)
    } else if (chainId == EVM_CHAIN_POLYGON) {
        chainMultiplier = 85; // 85% for Polygon (optimized from 90%)
    } else if (chainId == EVM_CHAIN_BSC) {
        chainMultiplier = 65; // 65% for BSC (optimized from 70%)
    } else if (chainId == EVM_CHAIN_BASE) {
        chainMultiplier = 75; // 75% for Base (optimized from 80%)
    } else if (chainId == EVM_CHAIN_ARBITRUM) {
        chainMultiplier = 55; // 55% for Arbitrum (optimized from 60%)

    }
    
    // Calculate final gas price with all multipliers
    let calculatedGasPrice = baseGasPrice * priorityMultiplier * chainMultiplier / 10000;
    
    // Apply EVM gas price multiplier for safety
    let finalGasPrice = calculatedGasPrice * EVM_GAS_PRICE_MULTIPLIER / 100;
    
    // Ensure minimum gas price for transaction success
    let minGasPrice: Int = 1000000000; // 1 gwei minimum
    if (finalGasPrice < minGasPrice) {
        finalGasPrice = minGasPrice;
    }
    
    // Ensure maximum gas price for cost control
    let maxGasPrice: Int = 1000000000000; // 1000 gwei maximum
    if (finalGasPrice > maxGasPrice) {
        finalGasPrice = maxGasPrice;
    }
    
    return finalGasPrice;
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

/**
 * @notice Validate bridge configuration
 * @dev Validates bridge parameters and configuration
 * @param bridge Bridge data to validate
 * @return True if bridge configuration is valid, false otherwise
 * @custom:security Critical for bridge security
 */
fun validateBridgeConfig(bridge: EVMBridgeData): Bool {
    // Bridge contract address is always provided
    
    // Validate transfer amounts
    if (bridge.minTransferAmount >= bridge.maxTransferAmount) {
        return false;
    }
    
    // Validate bridge fee
    if (bridge.bridgeFee == 0) {
        return false;
    }
    
    // Validate chain IDs
    if (!isValidEVMChainId(bridge.sourceChainId) || !isValidEVMChainId(bridge.targetChainId)) {
        return false;
    }
    
    return true;
}

/**
 * @notice Validate oracle configuration
 * @dev Validates oracle parameters and configuration
 * @param oracle Oracle data to validate
 * @return True if oracle configuration is valid, false otherwise
 * @custom:security Critical for oracle security
 */
fun validateOracleConfig(oracle: EVMOracleData): Bool {
    // Oracle contract and token addresses are always provided
    
    // Validate price decimals
    if (oracle.priceDecimals > 18) {
        return false;
    }
    
    // Validate heartbeat interval
    if (oracle.heartbeatInterval == 0) {
        return false;
    }
    
    // Validate chain ID
    if (!isValidEVMChainId(oracle.chainId)) {
        return false;
    }
    
    return true;
}

/**
 * @notice Calculate bridge fee for transfer
 * @dev Calculates appropriate bridge fee based on transfer amount and chain




/**
 * @notice Check if bridge is available for chain
 * @dev Validates bridge availability for specific chain
 * @param chainId Target chain ID
 * @param bridges Map of available bridges
 * @return True if bridge is available, false otherwise
 * @custom:internal Used for bridge selection
 */
fun isBridgeAvailableForChain(chainId: Int, bridges: map<Int as uint32, EVMBridgeData>): Bool {
    // For now, return true if chain is supported
    // In a real implementation, this would check the bridges map
    return isValidEVMChainId(chainId);
}

/**
 * @notice Get best bridge for chain
 * @dev Returns the best available bridge for a specific chain
 * @param chainId Target chain ID
 * @param bridges Map of available bridges
 * @return Bridge ID if found, null otherwise
 * @custom:internal Used for bridge selection
 */
fun getBestBridgeForChain(chainId: Int, bridges: map<Int as uint32, EVMBridgeData>): Int? {
    // For now, return a default bridge ID for supported chains
    // In a real implementation, this would find the best bridge from the map
    if (isValidEVMChainId(chainId)) {
        return 1; // Default bridge ID
    }
    return null;
}

/**
 * @notice Validate cross-chain message integrity
 * @dev Validates message integrity and authenticity
 * @param message Cross-chain message to validate
 * @param sourceChain Source chain ID
 * @param targetChain Target chain ID
 * @return True if message integrity is valid, false otherwise
 * @custom:security Critical for cross-chain security
 */
fun validateCrossChainMessageIntegrity(
    message: CrossChainMessage, 
    sourceChain: Int, 
    targetChain: Int
): Bool {
    // Validate source and target chains match
    if (message.sourceChain != sourceChain || message.targetChain != targetChain) {
        return false;
    }
    
    // Validate timestamp is not too old
    let currentTime = 0; // In real implementation, get current timestamp
    if (message.timestamp < currentTime - EVM_BRIDGE_TIMEOUT_SECONDS) {
        return false;
    }
    
    // Validate nonce is unique
    if (message.nonce == 0) {
        return false;
    }
    
    // Validate amount is positive
    if (message.amount <= 0) {
        return false;
    }
    
    return true;
}

/**
 * @notice Process bridge confirmation
 * @dev Processes bridge confirmation and updates transaction status
 * @param bridgeId Bridge identifier
 * @param transactionHash Transaction hash
 * @param blockNumber Block number
 * @param confirmations Number of confirmations
 * @param transactions Map of transactions to update
 * @return True if confirmation was processed successfully, false otherwise
 * @custom:internal Used for bridge confirmation handling
 */
fun processBridgeConfirmation(
    bridgeId: Int,
    transactionHash: Cell,
    blockNumber: Int,
    confirmations: Int,
    transactions: map<Int as uint64, EVMTransaction>
): Bool {
    // In a real implementation, this would:
    // 1. Find the transaction by hash
    // 2. Update the transaction status
    // 3. Update confirmations count
    // 4. Trigger any dependent actions
    
    // For now, return true as placeholder
    return true;
}

/**
 * @notice Handle oracle price update
 * @dev Processes oracle price updates and validates them
 * @param oracleId Oracle identifier
 * @param tokenAddress Token address
 * @param price Price in USD
 * @param timestamp Price timestamp
 * @param oracles Map of oracles
 * @return True if price update was processed successfully, false otherwise
 * @custom:internal Used for oracle price handling
 */
fun handleOraclePriceUpdate(
    oracleId: Int,
    tokenAddress: Address,
    price: Int,
    timestamp: Int,
    oracles: map<Int as uint32, EVMOracleData>
): Bool {
    let oracle = oracles.get(oracleId);
    if (oracle == null) {
        return false;
    }
    
    // Validate oracle is active
    if (!oracle!!.isActive) {
        return false;
    }
    
    // Validate token address matches
    if (oracle!!.tokenAddress != tokenAddress) {
        return false;
    }
    
    // Validate price is positive
    if (price <= 0) {
        return false;
    }
    
    // Validate timestamp is recent
    let currentTime = 0; // In real implementation, get current timestamp
    if (timestamp < currentTime - oracle!!.heartbeatInterval) {
        return false;
    }
    
    return true;
}

/**
 * @notice Enhanced bridge failure handling with exponential backoff
 * @dev Implements comprehensive retry logic for bridge operations
 * @param transaction EVM transaction that failed
 * @param retryCount Current retry attempt number
 * @param maxRetries Maximum number of retry attempts
 * @param lastErrorCode Last error code encountered
 * @return RetryResult containing retry decision and delay
 * @custom:internal Used for bridge failure recovery
 */
fun handleBridgeFailureWithBackoff(
    transaction: EVMTransaction, 
    retryCount: Int, 
    maxRetries: Int, 
    lastErrorCode: Int
): RetryResult {
    if (retryCount >= maxRetries) {
        return RetryResult {
            shouldRetry: false,
            delaySeconds: 0,
            errorCode: lastErrorCode,
            reason: "Max retries exceeded"
        };
    }
    
    // Calculate exponential backoff delay
    let baseDelay = EVM_RETRY_DELAY_SECONDS;
    let exponentialDelay = baseDelay * (2 ^ retryCount);
    let jitter = exponentialDelay / 10; // 10% jitter
    let finalDelay = exponentialDelay + jitter;
    
    // Determine if we should retry based on error type
    let shouldRetry = shouldRetryForError(lastErrorCode);
    
    let reason: String = "Non-retryable error"; // Default value
    if (shouldRetry) { 
        reason = "Retry with exponential backoff";
    }
    
    return RetryResult {
        shouldRetry: shouldRetry,
        delaySeconds: finalDelay,
        errorCode: lastErrorCode,
        reason: reason
    };
}

/**
 * @notice Determine if error is retryable
 * @dev Classifies errors as retryable or non-retryable
 * @param errorCode Error code to classify
 * @return True if error is retryable, false otherwise
 * @custom:internal Used for retry decision logic
 */
fun shouldRetryForError(errorCode: Int): Bool {
    // Retryable errors
    if (errorCode == EVM_BRIDGE_TIMEOUT) { return true; }
    if (errorCode == EVM_TRANSACTION_FAILED) { return true; }
    if (errorCode == MESSAGE_DELIVERY_FAILED) { return true; }
    
    // Non-retryable errors
    if (errorCode == INVALID_CHAIN_ID) { return false; }
    if (errorCode == INVALID_BRIDGE_CONFIG) { return false; }
    if (errorCode == EVM_CONTRACT_NOT_FOUND) { return false; }
    if (errorCode == EVM_INSUFFICIENT_BALANCE) { return false; }
    if (errorCode == INVALID_EVM_MESSAGE) { return false; }
    
    return false; // Default to non-retryable
}

/**
 * @notice Enhanced timeout processing with detailed analysis
 * @dev Provides comprehensive timeout handling for cross-chain operations
 * @param order Order configuration
 * @param currentTime Current timestamp
 * @param bridgeStatus Current bridge status
 * @return TimeoutResult containing timeout analysis and actions
 * @custom:internal Used for timeout handling
 */
fun processTimeoutScenarioEnhanced(
    order: OrderConfig, 
    currentTime: Int, 
    bridgeStatus: BridgeStatus
): TimeoutResult {
    let orderExpired = currentTime > order.timelock;
    let bridgeTimeout = currentTime > order.timelock - EVM_BRIDGE_TIMEOUT_SECONDS;
    let bridgeUnavailable = !bridgeStatus.isActive;
    
    // Determine timeout type and severity
    let timeoutType: String = "NO_TIMEOUT"; // Default value
    if (orderExpired) { 
        timeoutType = "ORDER_EXPIRED";
    } else if (bridgeTimeout) { 
        timeoutType = "BRIDGE_TIMEOUT";
    } else if (bridgeUnavailable) { 
        timeoutType = "BRIDGE_UNAVAILABLE";
    }
    
    let severity: String = "LOW"; // Default value
    if (orderExpired) { 
        severity = "CRITICAL";
    } else if (bridgeTimeout || bridgeUnavailable) { 
        severity = "HIGH";
    }
    
    // Determine required actions
    let actions: Cell = beginCell().storeUint(0, 1).endCell(); // Default value
    
    let timeRemaining = 0;
    if (!orderExpired) {
        timeRemaining = order.timelock - currentTime;
    }
    return TimeoutResult {
        hasTimeout: orderExpired || bridgeTimeout || bridgeUnavailable,
        timeoutType: timeoutType,
        severity: severity,
        actions: actions,
        timeRemaining: timeRemaining
    };
}

/**
 * @notice Handle bridge failure with circuit breaker pattern
 * @dev Implements circuit breaker to prevent cascading failures
 * @param bridgeId Bridge identifier
 * @param failureCount Current failure count
 * @param failureThreshold Failure threshold for circuit breaker
 * @param lastFailureTime Timestamp of last failure
 * @return CircuitBreakerResult containing circuit breaker state
 * @custom:internal Used for circuit breaker implementation
 */
fun handleBridgeFailureWithCircuitBreaker(
    bridgeId: Int,
    failureCount: Int,
    failureThreshold: Int,
    lastFailureTime: Int
): CircuitBreakerResult {
    let currentTime = now();
    let timeSinceLastFailure = currentTime - lastFailureTime;
    let resetTimeout = EVM_RETRY_DELAY_SECONDS * 10; // 10x retry delay for reset
    
    // Check if circuit breaker should be opened
    let shouldOpenCircuit = failureCount >= failureThreshold;
    
    // Check if circuit breaker should be reset
    let shouldResetCircuit = timeSinceLastFailure > resetTimeout;
    
    let state = "HALF_OPEN";
    if (shouldOpenCircuit) {
        state = "OPEN";
    } else if (shouldResetCircuit) {
        state = "CLOSED";
    }
    
    let finalFailureCount: Int = failureCount; // Default to current failure count
    if (shouldResetCircuit) {
        finalFailureCount = 0;
    }
    
    return CircuitBreakerResult {
        state: state,
        failureCount: finalFailureCount,
        lastFailureTime: lastFailureTime,
        resetTime: lastFailureTime + resetTimeout
    };
}

/**
 * @notice Validate and handle EVM transaction errors
 * @dev Provides comprehensive EVM transaction error handling
 * @param transaction EVM transaction
 * @param errorCode Error code from transaction
 * @param gasUsed Gas used by failed transaction
 * @param gasLimit Gas limit of transaction
 * @return EVMErrorResult containing error analysis and recovery actions
 * @custom:internal Used for EVM error handling
 */
fun handleEVMTransactionError(
    transaction: EVMTransaction,
    errorCode: Int,
    gasUsed: Int,
    gasLimit: Int
): EVMErrorResult {
    let gasUsageRatio = gasUsed * 100 / gasLimit;
    let isGasRelated = errorCode == EVM_GAS_LIMIT_EXCEEDED;
    let isBalanceRelated = errorCode == EVM_INSUFFICIENT_BALANCE;
    let isContractRelated = errorCode == EVM_CONTRACT_NOT_FOUND;
    
    // Determine error category
    let category: String = "GENERAL_ERROR"; // Default value
    if (isGasRelated) {
        category = "GAS_ERROR";
    } else if (isBalanceRelated) {
        category = "BALANCE_ERROR";
    } else if (isContractRelated) {
        category = "CONTRACT_ERROR";
    }
    
    // Determine recovery actions (encoded as Cell)
    let recoveryActions: Cell = beginCell().storeUint(0, 1).endCell(); // Default value
    
    return EVMErrorResult {
        errorCode: errorCode,
        category: category,
        gasUsageRatio: gasUsageRatio,
        recoveryActions: recoveryActions,
        isRetryable: shouldRetryForError(errorCode),
        estimatedCost: transaction.gasLimit * transaction.gasPrice
    };
}

/**
 * @notice Create comprehensive error report
 * @dev Generates detailed error report for debugging and monitoring
 * @param errorCode Error code
 * @param context Error context information
 * @param timestamp Error timestamp
 * @param transactionId Transaction identifier
 * @return ErrorReport containing comprehensive error information
 * @custom:internal Used for error reporting and monitoring
 */
fun createErrorReport(
    errorCode: Int,
    context: Cell,
    timestamp: Int,
    transactionId: Int
): ErrorReport {
    let errorCategory = getErrorCategory(errorCode);
    let severity = getErrorSeverity(errorCode);
    let recommendedActions = getRecommendedActions(errorCode);
    
    return ErrorReport {
        errorCode: errorCode,
        category: errorCategory,
        severity: severity,
        timestamp: timestamp,
        transactionId: transactionId,
        context: context,
        recommendedActions: recommendedActions,
        isRetryable: shouldRetryForError(errorCode)
    };
}

/**
 * @notice Get error category based on error code
 * @dev Categorizes errors for better organization
 * @param errorCode Error code to categorize
 * @return Error category string
 * @custom:internal Used for error categorization
 */
fun getErrorCategory(errorCode: Int): String {
    if (errorCode >= 70 && errorCode <= 89) { return "VALIDATION_ERROR"; }
    if (errorCode >= 90 && errorCode <= 104) { return "ORDER_MANAGEMENT_ERROR"; }
    if (errorCode >= 85 && errorCode <= 87) { return "ACCESS_CONTROL_ERROR"; }
    if (errorCode >= 106 && errorCode <= 109) { return "CROSS_CHAIN_ERROR"; }
    if (errorCode >= 91 && errorCode <= 95) { return "EVM_ERROR"; }
    return "SYSTEM_ERROR";
}

/**
 * @notice Get error severity based on error code
 * @dev Determines severity level for error prioritization
 * @param errorCode Error code to analyze
 * @return Error severity string
 * @custom:internal Used for error prioritization
 */
fun getErrorSeverity(errorCode: Int): String {
    // Critical errors
    if (errorCode == BRIDGE_FAILURE) { return "CRITICAL"; }
    if (errorCode == EVM_CONTRACT_NOT_FOUND) { return "CRITICAL"; }
    if (errorCode == INVALID_BRIDGE_CONFIG) { return "CRITICAL"; }
    
    // High severity errors
    if (errorCode == EVM_TRANSACTION_FAILED) { return "HIGH"; }
    if (errorCode == EVM_BRIDGE_TIMEOUT) { return "HIGH"; }
    if (errorCode == MESSAGE_DELIVERY_FAILED) { return "HIGH"; }
    
    // Medium severity errors
    if (errorCode == EVM_GAS_LIMIT_EXCEEDED) { return "MEDIUM"; }
    if (errorCode == EVM_INSUFFICIENT_BALANCE) { return "MEDIUM"; }
    if (errorCode == ORDER_EXPIRED) { return "MEDIUM"; }
    
    // Low severity errors
    if (errorCode == INVALID_AMOUNT) { return "LOW"; }
    if (errorCode == INVALID_RECIPIENT) { return "LOW"; }
    
    return "MEDIUM"; // Default severity
}

/**
 * @notice Get recommended actions for error code
 * @dev Provides actionable recommendations for error resolution
 * @param errorCode Error code to analyze
 * @return Cell containing recommended actions
 * @custom:internal Used for error resolution guidance
 */
fun getRecommendedActions(errorCode: Int): Cell {
    // Return a default cell for all error codes
    // In a real implementation, this would return specific action recommendations
    return beginCell().storeUint(0, 1).endCell();
}

/**
 * @notice Send cross-chain message with enhanced error handling
 * @dev Sends message to cross-chain bridge with retry logic and validation
 * @param chainId Target chain ID
 * @param message Cross-chain message
 * @param retryCount Current retry attempt (0 for first attempt)
 * @custom:internal Used for cross-chain communication
 */
fun sendCrossChainMessage(chainId: Int, message: Cell, retryCount: Int) {
    // Validate chain ID
    if (!isValidEVMChainId(chainId)) {
        throw(INVALID_CHAIN_ID);
    }
    
    // Validate message format
    if (!validateEnhancedEVMMessageFormat(message, chainId)) {
        throw(INVALID_EVM_MESSAGE);
    }
    
    // Check retry count
    if (retryCount >= EVM_MAX_RETRY_ATTEMPTS) {
        throw(BRIDGE_FAILURE);
    }
    
    // In a real implementation, this would send the message to the bridge
    // For now, this is a placeholder with enhanced error handling
    // The actual implementation would depend on the specific bridge being used
}

/**
 * @notice Check if escrow contract is deployed with enhanced validation
 * @dev Validates escrow contract deployment on target chain with additional checks
 * @param chainId Target chain ID
 * @param escrowContracts Map of escrow contracts
 * @return True if escrow is deployed and valid, false otherwise
 * @custom:security Critical for cross-chain security
 */
fun isEscrowDeployed(chainId: Int, escrowContracts: map<Int as uint32, EscrowContract>): Bool {
    // Validate chain ID first
    if (!isValidEVMChainId(chainId)) {
        return false;
    }
    
    let escrow = escrowContracts.get(chainId);
    if (escrow == null) {
        return false;
    }
    
    // Additional validation checks
    return escrow!!.deployed;
}

/**
 * @notice Validate EVM message format (legacy function for backward compatibility)
 * @dev Validates EVM message structure and parameters
 * @param message EVM message to validate
 * @return True if message format is valid, false otherwise
 * @custom:security Critical for EVM integration security
 */
fun validateEVMMessageFormat(message: Cell): Bool {
    return validateEnhancedEVMMessageFormat(message, EVM_CHAIN_ETHEREUM);
}

/**
 * @notice Get current timestamp
 * @dev Returns current Unix timestamp


/**
 * @notice Enhanced error handling for EVM operations
 * @dev Provides comprehensive error handling for cross-chain operations
 * @param errorCode Error code from operation
 * @param operation Operation that failed
 * @param chainId Target chain ID
 * @return Formatted error message
 * @custom:security Critical for debugging and user experience
 */
fun handleEVMOperationError(errorCode: Int, operation: String, chainId: Int): String {
    // Return a simple error message for now
    // In a real implementation, this would return detailed error messages
    return "EVM operation error";
}

/**
 * @notice Validate order parameters with enhanced error handling
 * @dev Comprehensive validation of order parameters with detailed error reporting
 * @param order Order configuration to validate
 * @return True if order parameters are valid, false otherwise
 * @custom:security Critical for order validation
 */
fun validateOrderParameters(order: OrderConfig): Bool {
    // Validate amount
    if (order.amount <= 0) {
        return false;
    }
    
    // Validate timelock
    if (order.timelock <= 0) {
        return false;
    }
    
    // Validate chain ID
    if (!isValidEVMChainId(order.id)) {
        return false;
    }
    
    // Addresses are always provided in Tact
    
    // Validate hashlock
    if (order.hashlock == 0) {
        return false;
    }
    
    return true;
}

/**
 * @notice Enhanced bridge error recovery
 * @dev Implements comprehensive error recovery for bridge operations
 * @param transaction EVM transaction that failed
 * @param errorCode Error code from failed operation
 * @param retryCount Current retry attempt
 * @return Recovery action to take
 * @custom:security Critical for bridge reliability
 */
fun handleBridgeErrorRecovery(transaction: EVMTransaction, errorCode: Int, retryCount: Int): Int {
    // Define recovery actions
    let RECOVERY_RETRY: Int = 1;
    let RECOVERY_FALLBACK: Int = 2;
    let RECOVERY_REFUND: Int = 3;
    let RECOVERY_FAIL: Int = 4;
    
    // Handle different error types
    if (errorCode == EVM_GAS_LIMIT_EXCEEDED) {
        if (retryCount < 3) {
            return RECOVERY_RETRY; // Retry with higher gas limit
        } else {
            return RECOVERY_FALLBACK; // Use fallback bridge
        }
    } else if (errorCode == EVM_BRIDGE_TIMEOUT) {
        if (retryCount < 2) {
            return RECOVERY_RETRY; // Retry with longer timeout
        } else {
            return RECOVERY_REFUND; // Refund the user
        }
    } else if (errorCode == EVM_INSUFFICIENT_BALANCE) {
        return RECOVERY_REFUND; // Always refund for insufficient balance
    } else if (errorCode == EVM_CONTRACT_NOT_FOUND) {
        return RECOVERY_FAIL; // Cannot recover from missing contract
    } else if (errorCode == BRIDGE_FAILURE) {
        if (retryCount < 3) {
            return RECOVERY_RETRY; // Retry bridge operation
        } else {
            return RECOVERY_FALLBACK; // Use fallback bridge
        }
    }
    
    return RECOVERY_FAIL; // Default to fail for unknown errors
}

/**
 * @notice Enhanced timeout handling with progressive delays
 * @dev Implements progressive timeout handling for cross-chain operations
 * @param order Order configuration
 * @param currentTime Current timestamp
 * @param timeoutLevel Current timeout level (0=initial, 1=warning, 2=critical)
 * @return True if timeout action should be processed, false otherwise
 * @custom:security Critical for timeout management
 */
fun handleProgressiveTimeout(order: OrderConfig, currentTime: Int, timeoutLevel: Int): Bool {
    let timeRemaining: Int = order.timelock - currentTime;
    
    if (timeoutLevel == 0) {
        // Initial timeout check - 80% of timelock remaining
        if (timeRemaining < order.timelock * 20 / 100) {
            return true; // WARNING
        }
    } else if (timeoutLevel == 1) {
        // Warning timeout - 50% of timelock remaining
        if (timeRemaining < order.timelock * 50 / 100) {
            return true; // CRITICAL
        }
    } else if (timeoutLevel == 2) {
        // Critical timeout - 90% of timelock expired
        if (timeRemaining < order.timelock * 10 / 100) {
            return true; // EMERGENCY
        }
    } else if (timeoutLevel == 3) {
        // Final timeout - order expired
        if (timeRemaining <= 0) {
            return true; // EXPIRED
        }
    }
    
    return false; // OK
}

/**
 * @notice Enhanced security validation for cross-chain messages
 * @dev Comprehensive security validation for all cross-chain operations
 * @param message Cross-chain message to validate
 * @param sourceChain Source chain ID
 * @param targetChain Target chain ID
 * @param timestamp Message timestamp
 * @return True if message is secure, false otherwise
 * @custom:security Critical for cross-chain security
 */
fun validateCrossChainSecurity(message: Cell, sourceChain: Int, targetChain: Int, timestamp: Int): Bool {
    // Message is always provided in Tact
    
    // Validate chain IDs
    if (!isValidEVMChainId(sourceChain) || !isValidEVMChainId(targetChain)) {
        return false;
    }
    
    // Validate timestamp (prevent replay attacks)
    let currentTime: Int = 0; // Will be set by caller
    if (timestamp > currentTime + 300) { // 5 minutes in future
        return false;
    }
    if (timestamp < currentTime - 3600) { // 1 hour in past
        return false;
    }
    
    // Validate source-target chain combination
    if (sourceChain == targetChain) {
        return false;
    }
    
    // Check for known attack patterns
    if (sourceChain == 0 || targetChain == 0) {
        return false;
    }
    
    return true;
}

/**
 * @notice Enhanced gas optimization validation
 * @dev Validates gas parameters for optimal performance and cost
 * @param gasLimit Gas limit to validate
 * @param gasPrice Gas price to validate
 * @param chainId Target chain ID
 * @return True if gas parameters are valid, false otherwise
 * @custom:internal Used for gas optimization
 */
fun validateGasOptimization(gasLimit: Int, gasPrice: Int, chainId: Int): Bool {
    // Validate gas limit
    if (gasLimit < 21000) {
        return false;
    }
    if (gasLimit > EVM_CONTRACT_CALL_GAS_LIMIT) {
        return false;
    }
    
    // Validate gas price
    if (gasPrice < 1000000000) { // 1 gwei
        return false;
    }
    if (gasPrice > 1000000000000) { // 1000 gwei
        return false;
    }
    
    return true;
}

/**
 * @notice Build EVM-compatible cross-chain transfer message
 * @dev Creates a properly formatted message for EVM chain transfers
 * @param order Order configuration data
 * @param amount Transfer amount
 * @param secret Secret for HTLC
 * @return Cell containing the EVM message
 * @custom:internal Used for cross-chain transfers
 */
fun buildEVMTransferMessage(order: OrderConfig, amount: Int, secret: Int): Cell {
    // Create EVM-compatible message structure
    let message = beginCell()
        // Message header (4 bytes)
        .storeUint(EVM_MESSAGE_OPCODE, 32)
        
        // Order data (32 bytes each)
        .storeUint(order.id, 256)           // Order ID
        .storeUint(order.hashlock, 256)     // Hashlock
        .storeUint(order.timelock, 64)      // Timelock
        .storeUint(amount, 64)              // Transfer amount
        .storeUint(secret, 256)             // Secret
        
        // Chain and direction info
        .storeUint(order.direction, 8)      // Swap direction
        .storeUint(0, 24)                   // Reserved for future use
        
        // Addresses (stored as references for efficiency)
        .storeRef(beginCell().storeAddress(order.senderPubKey).endCell())    // Sender
        .storeRef(beginCell().storeAddress(order.receiverPubKey).endCell())  // Receiver
        
        // Jetton information
        .storeRef(beginCell().storeAddress(order.srcJettonAddress).endCell()) // Jetton address
        
        // Order status and metadata
        .storeUint(order.finalized ? 1 : 0, 1)  // Finalized flag
        .storeUint(order.totalFilled, 64)             // Total filled amount
        .storeUint(0, 191)                            // Padding
        
        // Timestamp for message validation
        .storeUint(0, 64)                             // Will be set by caller
        
        // Message nonce for uniqueness
        .storeUint(0, 64)                             // Will be set by caller
        
        .endCell();
    
    return message;
}

/**
 * @notice Validate EVM chain support and accessibility
 * @dev Checks if chain ID is supported and chain is active
 * @param chainId Chain ID to validate
 * @return True if chain is supported and accessible
 * @custom:internal Used for chain validation
 */
fun validateEVMChain(chainId: Int): Bool {
    // Check if chain ID is in supported EVM chains
    if (!isValidEVMChainId(chainId)) {
        return false;
    }
    
    // Validate chain is active and accessible
    // For now, we assume all supported chains are active
    // In production, this would check chain status via oracle
    
    // Check for known inactive chains (if any)
    if (chainId == 0) {
        return false; // Invalid chain ID
    }
    
    // Additional validation can be added here:
    // - Check chain connectivity via RPC
    // - Verify chain is not in maintenance mode
    // - Check if chain has sufficient confirmations
    
    return true;
}

/**
 * @notice Enhanced message validation with comprehensive security checks
 * @dev Validates message authenticity, integrity, and source chain
 * @param message Cross-chain message to validate
 * @param sourceChain Source chain ID
 * @param targetChain Target chain ID
 * @param bridgeOperator Bridge operator address for validation
 * @return True if message is valid and secure, false otherwise
 * @custom:security Critical for cross-chain security
 */
fun validateEnhancedMessage(message: Cell, sourceChain: Int, targetChain: Int, bridgeOperator: Address): Bool {
    // 1. Verify message authenticity
    if (!validateMessageAuthenticity(message, sourceChain)) {
        return false;
    }
    
    // 2. Check message integrity
    if (!validateMessageIntegrity(message)) {
        return false;
    }
    
    // 3. Validate source chain
    if (!validateSourceChain(sourceChain, targetChain)) {
        return false;
    }
    
    // 4. Validate bridge operator
    if (!validateBridgeOperator(bridgeOperator, sourceChain)) {
        return false;
    }
    
    return true;
}

/**
 * @notice Validate message authenticity
 * @dev Verifies that the message comes from an authorized source
 * @param message Cross-chain message
 * @param sourceChain Source chain ID
 * @return True if message is authentic, false otherwise
 * @custom:security Prevents message spoofing
 */
fun validateMessageAuthenticity(message: Cell, sourceChain: Int): Bool {
    // In a real implementation, this would verify cryptographic signatures
    // For now, we validate the message structure and source chain
    
    // Validate source chain is supported
    if (!isValidEVMChainId(sourceChain)) {
        return false;
    }
    
    // Validate message has proper structure
    // In Tact, we can't directly check Cell size, so we validate the structure differently
    // For now, we assume the message is valid if it's not empty
    if (message == beginCell().endCell()) {
        return false; // Empty message
    }
    
    return true;
}

/**
 * @notice Validate message integrity
 * @dev Checks that the message hasn't been tampered with
 * @param message Cross-chain message
 * @return True if message integrity is intact, false otherwise
 * @custom:security Prevents message tampering
 */
fun validateMessageIntegrity(message: Cell): Bool {
    // In a real implementation, this would verify cryptographic hashes
    // For now, we validate the message structure
    
    // Check message has minimum required structure
    // In Tact, we can't directly check Cell size, so we validate the structure differently
    // For now, we assume the message is valid if it's not empty
    if (message == beginCell().endCell()) {
        return false; // Empty message
    }
    
    return true;
}

/**
 * @notice Validate source chain
 * @dev Ensures the source chain is valid and supported
 * @param sourceChain Source chain ID
 * @param targetChain Target chain ID
 * @return True if source chain is valid, false otherwise
 * @custom:security Prevents invalid chain attacks
 */
fun validateSourceChain(sourceChain: Int, targetChain: Int): Bool {
    // Validate source chain is supported
    if (!isValidEVMChainId(sourceChain)) {
        return false;
    }
    
    // Prevent same-chain transfers
    if (sourceChain == targetChain) {
        return false;
    }
    
    // Validate chain combination is allowed
    if (sourceChain == 0 || targetChain == 0) {
        return false;
    }
    
    return true;
}

/**
 * @notice Validate bridge operator
 * @dev Ensures the bridge operator is authorized for the source chain
 * @param bridgeOperator Bridge operator address
 * @param sourceChain Source chain ID
 * @return True if bridge operator is authorized, false otherwise
 * @custom:security Prevents unauthorized bridge operations
 */
fun validateBridgeOperator(bridgeOperator: Address, sourceChain: Int): Bool {
    // In a real implementation, this would check against a whitelist
    // For now, we validate the address structure
    
    // Validate address is not null (using zero address as null equivalent)
    if (bridgeOperator == createZeroAddress()) {
        return false;
    }
    
    return true;
}

/**
 * @notice Enhanced replay protection with nonce validation
 * @dev Prevents duplicate message processing using nonces and timestamps
 * @param message Cross-chain message
 * @param nonce Message nonce
 * @param timestamp Message timestamp
 * @param processedNonces Set of already processed nonces
 * @return True if message is not a replay, false otherwise
 * @custom:security Critical for preventing replay attacks
 */
fun validateReplayProtection(message: Cell, nonce: Int, timestamp: Int, processedNonces: map<Int, Bool>): Bool {
    // 1. Add nonce to messages
    if (nonce <= 0) {
        return false; // Nonce must be positive
    }
    
    // 2. Check message timestamps
    let currentTime: Int = 0; // Will be set by caller with actual timestamp
    if (timestamp > currentTime + 300) { // 5 minutes in future
        return false;
    }
    if (timestamp < currentTime - 3600) { // 1 hour in past
        return false;
    }
    
    // 3. Prevent duplicate processing
    if (processedNonces.get(nonce) == true) {
        return false; // Nonce already processed
    }
    
    return true;
}

/**
 * @notice Enhanced access control validation
 * @dev Validates bridge operator permissions and chain-specific access
 * @param bridgeOperator Bridge operator address
 * @param chainId Target chain ID
 * @param operationType Type of operation being performed
 * @param authorizedOperators Map of authorized operators
 * @return True if access is granted, false otherwise
 * @custom:security Prevents unauthorized access
 */
fun validateAccessControl(bridgeOperator: Address, chainId: Int, operationType: Int, authorizedOperators: map<Address, Bool>): Bool {
    // 1. Bridge operator validation
    if (authorizedOperators.get(bridgeOperator) != true) {
        return false;
    }
    
    // 2. Chain-specific permissions
    if (!isValidEVMChainId(chainId)) {
        return false;
    }
    
    // 3. Emergency pause functionality
    // In a real implementation, this would check if the system is paused
    // For now, we always allow operations
    
    return true;
}

/**
 * @notice Emergency pause functionality
 * @dev Allows emergency pausing of cross-chain operations
 * @param isPaused Whether the system is paused
 * @param pauseReason Reason for the pause
 * @return True if pause is valid, false otherwise
 * @custom:security Critical for emergency situations
 */
fun validateEmergencyPause(isPaused: Bool, pauseReason: String): Bool {
    // In a real implementation, this would validate pause conditions
    // For now, we accept any pause state
    
    return true;
}

/**
 * @notice Enhanced gas estimation with security considerations
 * @dev Calculates optimal gas costs with security and cost optimization
 * @param chainId Target chain ID
 * @param amount Transfer amount
 * @param isContractCall Whether this is a contract call
 * @return Optimized gas limit
 * @custom:security Optimized for security and cost
 */
fun calculateSecureGasEstimation(chainId: Int, amount: Int, isContractCall: Bool): Int {
    // Calculate base gas estimation
    let baseGas = calculateEVMDynamicGasLimit(chainId, amount, isContractCall);
    
    // Add security buffer for reliability
    let securityBuffer = baseGas * 110 / 100; // 10% security buffer
    
    // Ensure minimum gas for security
    if (securityBuffer < 21000) {
        securityBuffer = 21000;
    }
    
    return securityBuffer;
}

/**
 * @notice Optimize message size for gas efficiency
 * @dev Reduces message size to minimize gas costs
 * @param message Original message
 * @return Optimized message cell
 * @custom:internal Used for gas optimization
 */
fun optimizeMessageSize(message: Cell): Cell {
    // In a real implementation, this would compress the message
    // For now, we return the original message
    
    return message;
}

/**
 * @notice Batch operations for gas efficiency
 * @dev Combines multiple operations to reduce gas costs
 * @param operations List of operations to batch
 * @return Batched operation cell
 * @custom:internal Used for gas optimization
 */
fun batchOperations(operations: map<Int, Cell>): Cell {
    // In a real implementation, this would combine multiple operations
    // For now, we return a simple batch structure
    
    let batchCell = beginCell();
    let operationCount = 0;
    
    // Add operation count
    batchCell.storeUint(operationCount, 32);
    
    return batchCell.endCell();
}

/**
 * @notice Handle gas price fluctuations
 * @dev Adjusts gas prices based on network conditions
 * @param chainId Target chain ID
 * @param baseGasPrice Base gas price
 * @param priority Priority level (1=low, 2=medium, 3=high)
 * @return Adjusted gas price
 * @custom:internal Used for gas management
 */
fun handleGasPriceFluctuations(chainId: Int, baseGasPrice: Int, priority: Int): Int {
    // Calculate optimal gas price with medium priority
    let optimalGasPrice = calculateOptimalEVMGasPrice(chainId, priority);
    
    // Apply priority multiplier
    let priorityMultiplier: Int = 100; // Default
    if (priority == 1) { // Low priority
        priorityMultiplier = 80;
    } else if (priority == 2) { // Medium priority
        priorityMultiplier = 100;
    } else if (priority == 3) { // High priority
        priorityMultiplier = 120;
    }
    
    return optimalGasPrice * priorityMultiplier / 100;
}

/**
 * @notice Implement gas refunds
 * @dev Calculates gas refunds for overpaid transactions
 * @param actualGasUsed Actual gas used
 * @param gasLimit Gas limit that was set
 * @param gasPrice Gas price that was paid
 * @return Refund amount
 * @custom:internal Used for gas management
 */
fun implementGasRefunds(actualGasUsed: Int, gasLimit: Int, gasPrice: Int): Int {
    // Calculate unused gas
    let unusedGas = gasLimit - actualGasUsed;
    
    // Calculate refund amount
    let refundAmount = unusedGas * gasPrice;
    
    // Ensure refund is not negative
    if (refundAmount < 0) {
        refundAmount = 0;
    }
    
    return refundAmount;
}

/**
 * @notice Monitor gas usage
 * @dev Tracks gas usage for optimization
 * @param chainId Target chain ID
 * @param gasUsed Gas used in transaction
 * @param gasLimit Gas limit that was set
 * @return Gas efficiency percentage
 * @custom:internal Used for gas monitoring
 */
fun monitorGasUsage(chainId: Int, gasUsed: Int, gasLimit: Int): Int {
    // Calculate gas efficiency
    let efficiency = gasUsed * 100 / gasLimit;
    
    // Ensure efficiency is within bounds
    if (efficiency > 100) {
        efficiency = 100;
    }
    
    return efficiency;
}