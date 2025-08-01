/**
 * @title TonFusion States and Data Structures
 * @author TonFusion Team
 * @notice Data structures and constants for the TonFusion HTLC protocol
 * @dev Defines the core data models used throughout the protocol
 * 
 * @custom:version 1.0.0
 * 
 * Data Structure Categories:
 * - Order structures (OrderConfig, Order)
 * - Escrow and relayer data (EscrowContract, RelayerData)
 * - Utility structures (CalculateOutput, PointAndTimeDelta, JettonWalletData)
 * - Constants for swap directions and HTLC status
 */

/// @notice Gas cost for jetton transfers
/// @dev Standard gas cost for jetton operations
const JettonTransferGas: Int = ton("0.05");

/**
 * @notice Output calculation structure for fee calculations
 * @dev Used for calculating protocol and integrator fees
 * @param protocolFeeAmount Amount of protocol fee
 * @param integratorFeeAmount Amount of integrator fee
 * @param outputAmount Final output amount after fees
 */
struct CalculateOutput {
    protocolFeeAmount:Int as uint64;
    integratorFeeAmount:Int as uint64;
    outputAmount:Int as uint64;
}

/**
 * @notice Rate and time delta structure for dynamic pricing
 * @dev Used for adjusting rates based on time and market conditions
 * @param rateBump Rate adjustment factor (default: 0)
 * @param timeDelta Time-based adjustment factor (default: 0)
 */
struct PointAndTimeDelta {
    rateBump: Int as uint16 = 0;
    timeDelta: Int as uint16 = 0;
}

/**
 * @notice Cross-chain order configuration for TON ↔ EVM swaps
 * @dev Complete order data for cross-chain atomic swaps
 * @param id Chain ID for the order
 * @param srcJettonAddress Source jetton address on TON
 * @param senderPubKey Public key of the order sender
 * @param receiverPubKey Public key of the order receiver
 * @param hashlock Hashlock for HTLC validation (keccak256 of secret)
 * @param timelock Unix timestamp when order expires
 * @param amount Amount of jettons to swap
 * @param finalized Whether the order has been completed or refunded
 * @param partialFills Map of partial fill secrets to amounts
 * @param totalFilled Total amount filled across all partial fills
 * @param direction Swap direction (0=TON_TO_EVM, 1=EVM_TO_TON, 2=TON_TO_TON)
 * @custom:security hashlock must be keccak256 of a secret
 * @custom:security timelock must be in the future when order is created
 */
struct OrderConfig {
    id: Int as uint32; // Chain ID
    srcJettonAddress: Address;
    senderPubKey: Address;
    receiverPubKey: Address;
    hashlock: Int as uint256;
    timelock: Int as uint32;
    amount: Int as uint64;
    finalized: Bool = false;
    partialFills: map<Int as uint256, Int as uint64> = emptyMap(); // Multiple secrets for partial fills
    totalFilled: Int as uint64 = 0;
    direction: Int as uint8; // 0=TON_TO_EVM, 1=EVM_TO_TON, 2=TON_TO_TON
}

/**
 * @notice Same-chain order configuration for TON ↔ TON swaps
 * @dev Simplified order data for same-chain atomic swaps
 * @param id Chain ID for the order
 * @param srcJettonAddress Source jetton address on TON
 * @param senderPubKey Public key of the order sender
 * @param hashlock Hashlock for HTLC validation (keccak256 of secret)
 * @param timelock Unix timestamp when order expires
 * @param amount Amount of jettons to swap
 * @param finalized Whether the order has been completed or refunded
 * @param partialFills Map of partial fill secrets to amounts
 * @param totalFilled Total amount filled across all partial fills
 * @param direction Swap direction (2=TON_TO_TON only)
 * @custom:security hashlock must be keccak256 of a secret
 * @custom:security timelock must be in the future when order is created
 */
struct Order {
    id: Int as uint32; // Chain ID
    srcJettonAddress: Address;
    senderPubKey: Address;
    hashlock: Int as uint256;
    timelock: Int as uint32;
    amount: Int as uint64;
    finalized: Bool = false;
    partialFills: map<Int as uint256, Int as uint64> = emptyMap(); // Multiple secrets for partial fills
    totalFilled: Int as uint64 = 0;
    direction: Int as uint8; // 2=TON_TO_TON
}

/**
 * @notice Escrow contract data for target chains
 * @dev Tracks deployed escrow contracts on different chains
 * @param chainId Target chain ID where escrow is deployed
 * @param contractAddress Address of the deployed escrow contract
 * @param deployed Whether the escrow contract has been deployed
 * @param totalOrders Total number of orders processed by this escrow
 * @custom:security Only owner can deploy escrow contracts
 */
struct EscrowContract {
    chainId: Int as uint32;
    contractAddress: Address;
    deployed: Bool = false;
    totalOrders: Int as uint32 = 0;
}

/**
 * @notice Relayer/Resolver performance data
 * @dev Tracks relayer statistics for reputation system
 * @param address Relayer's address
 * @param whitelisted Whether the relayer is whitelisted
 * @param totalResolves Total number of orders resolved by this relayer
 * @param successRate Success rate as percentage (0-100)
 * @custom:security Relayers must be registered before they can resolve orders
 */
struct RelayerData {
    address: Address;
    whitelisted: Bool = false;
    totalResolves: Int as uint32 = 0;
    successRate: Int as uint16 = 0; // Percentage
}

/**
 * @notice Swap direction constants
 * @dev Used to identify the type of swap being performed
 */
/// @notice TON to EVM chain swap
const TON_TO_EVM: Int = 0;
/// @notice EVM chain to TON swap
const EVM_TO_TON: Int = 1;
/// @notice TON to TON same-chain swap
const TON_TO_TON: Int = 2;

/**
 * @notice HTLC status constants
 * @dev Used to track the current state of HTLC orders
 */
/// @notice Order is pending and can be filled
const HTLC_PENDING: Int = 0;
/// @notice Order has been completed successfully
const HTLC_COMPLETED: Int = 1;
/// @notice Order has expired and can be refunded
const HTLC_EXPIRED: Int = 2;
/// @notice Order has been refunded to original sender
const HTLC_REFUNDED: Int = 3;

/**
 * @notice Jetton wallet initialization data
 * @dev Used for calculating jetton wallet addresses
 * @param balance Initial balance of the jetton wallet
 * @param ownerAddress Address of the wallet owner
 * @param jettonMasterAddress Address of the jetton master contract
 * @param jettonWalletCode Code cell for the jetton wallet contract
 * @custom:internal Used internally for address calculation
 */
struct JettonWalletData {
    balance: Int as coins;
    ownerAddress: Address;
    jettonMasterAddress: Address;
    jettonWalletCode: Cell;
}

/**
 * @notice EVM chain configuration data
 * @dev Contains chain-specific parameters for EVM integration
 * @param chainId EVM chain ID
 * @param rpcEndpoint RPC endpoint for the chain
 * @param blockTime Average block time in seconds
 * @param gasLimit Default gas limit for transactions
 * @param isActive Whether the chain is active for swaps
 * @param bridgeAddress Bridge contract address for cross-chain transfers
 * @param oracleAddress Oracle contract address for price feeds
 * @custom:security Chain configuration must be validated before use
 */
struct EVMChainConfig {
    chainId: Int as uint32;
    rpcEndpoint: Cell; // Encoded as string
    blockTime: Int as uint32;
    gasLimit: Int as uint32;
    isActive: Bool = true;
    bridgeAddress: Cell; // Bridge contract address encoded as cell
    oracleAddress: Cell; // Oracle contract address encoded as cell
}

/**
 * @notice EVM transaction data for cross-chain operations
 * @dev Contains transaction details for EVM chain interactions
 * @param chainId Target EVM chain ID
 * @param toContract Target contract address
 * @param functionSelector Function selector (4 bytes)
 * @param parameters Function parameters
 * @param gasLimit Gas limit for the transaction
 * @param gasPrice Gas price for the transaction
 * @param value ETH value to send
 * @param nonce Transaction nonce
 * @param status Transaction status (0=pending, 1=confirmed, 2=failed)
 * @param transactionHash EVM transaction hash
 * @param blockNumber Block number where transaction was included
 * @param confirmations Number of confirmations
 * @custom:security Transaction data must be validated before execution
 */
struct EVMTransaction {
    chainId: Int as uint32;
    toContract: Cell; // Target contract address encoded as cell
    functionSelector: Int as uint32;
    parameters: Cell;
    gasLimit: Int as uint32;
    gasPrice: Int as uint64;
    value: Int as uint64;
    nonce: Int as uint64;
    status: Int as uint8 = 0; // 0=pending, 1=confirmed, 2=failed
    transactionHash: Cell; // Encoded as bytes32
    blockNumber: Int as uint64 = 0;
    confirmations: Int as uint32 = 0;
}

/**
 * @notice EVM bridge data for cross-chain transfers
 * @dev Contains bridge-specific information for cross-chain operations
 * @param bridgeId Unique bridge identifier
 * @param sourceChainId Source chain ID
 * @param targetChainId Target chain ID
 * @param bridgeContract Bridge contract address
 * @param bridgeFee Bridge fee for transfers
 * @param minTransferAmount Minimum transfer amount
 * @param maxTransferAmount Maximum transfer amount
 * @param isActive Whether the bridge is active
 * @param lastUpdateTimestamp Last update timestamp
 * @custom:security Bridge configuration must be validated before use
 */
struct EVMBridgeData {
    bridgeId: Int as uint32;
    sourceChainId: Int as uint32;
    targetChainId: Int as uint32;
    bridgeContract: Address;
    bridgeFee: Int as uint64;
    minTransferAmount: Int as uint64;
    maxTransferAmount: Int as uint64;
    isActive: Bool = true;
    lastUpdateTimestamp: Int as uint32;
}

/**
 * @notice EVM oracle data for price feeds
 * @dev Contains oracle-specific information for price updates
 * @param oracleId Unique oracle identifier
 * @param chainId EVM chain ID where oracle operates
 * @param oracleContract Oracle contract address
 * @param tokenAddress Token address for price feed
 * @param priceDecimals Number of decimal places for price
 * @param heartbeatInterval Heartbeat interval for price updates
 * @param isActive Whether the oracle is active
 * @param lastPriceUpdate Last price update timestamp
 * @custom:security Oracle data must be validated before use
 */
struct EVMOracleData {
    oracleId: Int as uint32;
    chainId: Int as uint32;
    oracleContract: Address;
    tokenAddress: Address;
    priceDecimals: Int as uint8;
    heartbeatInterval: Int as uint32;
    isActive: Bool = true;
    lastPriceUpdate: Int as uint32;
}

/**
 * @notice Cross-chain message for EVM communication
 * @dev Contains message data for cross-chain transfers
 * @param sourceChain Source chain ID
 * @param targetChain Target chain ID
 * @param orderHash Hash of the order being processed
 * @param amount Transfer amount
 * @param secret Secret for order validation
 * @param timestamp Message timestamp
 * @param nonce Unique message nonce
 * @custom:security Message data must be validated before processing
 */
struct CrossChainMessage {
    sourceChain: Int as uint32;
    targetChain: Int as uint32;
    orderHash: Int as uint256;
    amount: Int as uint64;
    secret: Int as uint256;
    timestamp: Int as uint32;
    nonce: Int as uint64;
}

/**
 * @notice Comprehensive chain validation result
 * @dev Contains detailed validation status for chain operations
 * @param isValid Whether the chain validation passed
 * @param errorCode Error code if validation failed
 * @param errorMessage Human-readable error message
 * @param chainId Target chain ID that was validated
 * @param isEscrowDeployed Whether escrow contract is deployed
 * @param isChainConnected Whether chain connectivity is valid
 * @custom:security Validation results must be checked before proceeding
 */
struct ValidationResult {
    isValid: Bool;
    errorCode: Int as uint32;
    errorMessage: Cell;
    chainId: Int as uint32;
    isEscrowDeployed: Bool;
    isChainConnected: Bool;
}

/**
 * @notice Escrow deployment validation result
 * @dev Contains detailed escrow validation status
 * @param isDeployed Whether escrow contract is deployed
 * @param contractAddress Escrow contract address
 * @param totalOrders Total number of orders processed by escrow
 * @param isActive Whether escrow contract is active
 * @param errorCode Error code if validation failed
 * @param errorMessage Human-readable error message
 * @custom:security Escrow validation is critical for cross-chain security
 */
struct EscrowValidationResult {
    isDeployed: Bool;
    contractAddress: Cell;
    totalOrders: Int as uint32;
    isActive: Bool;
    errorCode: Int as uint32;
    errorMessage: Cell;
}

/**
 * @notice Chain connectivity status
 * @dev Contains connectivity information for a specific chain
 * @param chainId Target chain ID
 * @param isConnected Whether chain is connected
 * @param lastPingTimestamp Last successful ping timestamp
 * @param responseTime Average response time in milliseconds
 * @param errorCount Number of consecutive connection errors
 * @param isActive Whether chain is considered active
 * @custom:internal Used for monitoring chain health
 */
struct ChainConnectivityStatus {
    chainId: Int as uint32;
    isConnected: Bool;
    lastPingTimestamp: Int as uint32;
    responseTime: Int as uint32; // in milliseconds
    errorCount: Int as uint32;
    isActive: Bool;
}

// ============================================================================
// ERROR HANDLING DATA STRUCTURES
// ============================================================================

/**
 * @notice Bridge status information
 * @dev Contains bridge operational status and health metrics
 * @param isActive Whether bridge is currently active
 * @param lastHeartbeat Last heartbeat timestamp
 * @param failureCount Number of consecutive failures
 * @param totalTransactions Total transactions processed
 * @param successRate Success rate percentage
 * @custom:internal Used for bridge health monitoring
 */
struct BridgeStatus {
    isActive: Bool;
    lastHeartbeat: Int as uint32;
    failureCount: Int as uint32;
    totalTransactions: Int as uint32;
    successRate: Int as uint8; // Percentage (0-100)
}

/**
 * @notice Retry result for bridge operations
 * @dev Contains retry decision and timing information
 * @param shouldRetry Whether retry should be attempted
 * @param delaySeconds Delay before next retry attempt
 * @param errorCode Last error code encountered
 * @param reason Human-readable reason for retry decision
 * @custom:internal Used for retry logic implementation
 */
struct RetryResult {
    shouldRetry: Bool;
    delaySeconds: Int as uint32;
    errorCode: Int as uint32;
    reason: String;
}

/**
 * @notice Timeout analysis result
 * @dev Contains comprehensive timeout analysis and recommended actions
 * @param hasTimeout Whether a timeout condition exists
 * @param timeoutType Type of timeout (ORDER_EXPIRED, BRIDGE_TIMEOUT, etc.)
 * @param severity Severity level (CRITICAL, HIGH, MEDIUM, LOW)
 * @param actions Array of recommended actions
 * @param timeRemaining Time remaining before timeout (0 if expired)
 * @custom:internal Used for timeout handling
 */
struct TimeoutResult {
    hasTimeout: Bool;
    timeoutType: String;
    severity: String;
    actions: Cell; // Encoded as array of strings
    timeRemaining: Int as uint32;
}

/**
 * @notice Circuit breaker state
 * @dev Contains circuit breaker status and failure tracking
 * @param state Circuit breaker state (OPEN, CLOSED, HALF_OPEN)
 * @param failureCount Current failure count
 * @param lastFailureTime Timestamp of last failure
 * @param resetTime Timestamp when circuit breaker will reset
 * @custom:internal Used for circuit breaker implementation
 */
struct CircuitBreakerResult {
    state: String;
    failureCount: Int as uint32;
    lastFailureTime: Int as uint32;
    resetTime: Int as uint32;
}

/**
 * @notice EVM transaction error analysis
 * @dev Contains detailed EVM transaction error information and recovery actions
 * @param errorCode Error code from transaction
 * @param category Error category (GAS_ERROR, BALANCE_ERROR, etc.)
 * @param gasUsageRatio Gas usage as percentage of limit
 * @param recoveryActions Array of recommended recovery actions
 * @param isRetryable Whether error is retryable
 * @param estimatedCost Estimated cost of retry attempt
 * @custom:internal Used for EVM error handling
 */
struct EVMErrorResult {
    errorCode: Int as uint32;
    category: String;
    gasUsageRatio: Int as uint8; // Percentage (0-100)
    recoveryActions: Cell; // Encoded as array of strings
    isRetryable: Bool;
    estimatedCost: Int as uint64;
}

/**
 * @notice Comprehensive error report
 * @dev Contains detailed error information for debugging and monitoring
 * @param errorCode Error code
 * @param category Error category
 * @param severity Error severity level
 * @param timestamp Error timestamp
 * @param transactionId Transaction identifier
 * @param context Error context information
 * @param recommendedActions Array of recommended actions
 * @param isRetryable Whether error is retryable
 * @custom:internal Used for error reporting and monitoring
 */
struct ErrorReport {
    errorCode: Int as uint32;
    category: String;
    severity: String;
    timestamp: Int as uint32;
    transactionId: Int as uint32;
    context: Cell;
    recommendedActions: Cell; // Encoded as array of strings
    isRetryable: Bool;
}

/**
 * @notice Bridge failure tracking
 * @dev Contains bridge failure statistics and recovery information
 * @param bridgeId Bridge identifier
 * @param failureCount Total failure count
 * @param lastFailureTime Timestamp of last failure
 * @param lastFailureCode Error code of last failure
 * @param recoveryAttempts Number of recovery attempts
 * @param isInRecovery Whether bridge is currently in recovery mode
 * @param circuitBreakerState Current circuit breaker state
 * @custom:internal Used for bridge failure tracking
 */
struct BridgeFailureTracking {
    bridgeId: Int as uint32;
    failureCount: Int as uint32;
    lastFailureTime: Int as uint32;
    lastFailureCode: Int as uint32;
    recoveryAttempts: Int as uint32;
    isInRecovery: Bool;
    circuitBreakerState: String;
}

/**
 * @notice Order timeout tracking
 * @dev Contains order timeout monitoring information
 * @param orderId Order identifier
 * @param timelock Order timelock
 * @param bridgeTimeout Bridge timeout threshold
 * @param lastCheckTime Last timeout check timestamp
 * @param timeoutStatus Current timeout status
 * @param escalationLevel Escalation level for timeout handling
 * @param notifiedParties Parties notified about timeout
 * @custom:internal Used for order timeout monitoring
 */
struct OrderTimeoutTracking {
    orderId: Int as uint32;
    timelock: Int as uint32;
    bridgeTimeout: Int as uint32;
    lastCheckTime: Int as uint32;
    timeoutStatus: String;
    escalationLevel: Int as uint8;
    notifiedParties: Cell; // Encoded as array of addresses
}

/**
 * @notice Retry configuration
 * @dev Contains retry strategy configuration
 * @param maxRetries Maximum number of retry attempts
 * @param baseDelay Base delay between retries in seconds
 * @param maxDelay Maximum delay between retries in seconds
 * @param backoffMultiplier Exponential backoff multiplier
 * @param jitterPercentage Jitter percentage for delay randomization
 * @param retryableErrors Array of retryable error codes
 * @custom:internal Used for retry strategy configuration
 */
struct RetryConfig {
    maxRetries: Int as uint8;
    baseDelay: Int as uint32;
    maxDelay: Int as uint32;
    backoffMultiplier: Int as uint8;
    jitterPercentage: Int as uint8;
    retryableErrors: Cell; // Encoded as array of error codes
}


