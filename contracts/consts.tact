/**
 * @title TonFusion Constants
 * @author TonFusion Team
 * @notice Mathematical constants and base values for the TonFusion HTLC protocol
 * @dev Provides standardized base values used throughout the protocol
 * 
 * @custom:version 1.0.0
 * 
 * Constant Categories:
 * - Mathematical base values
 * - Precision constants
 * - Scaling factors
 * - EVM chain constants
 * - Validation constants
 */

/**
 * @notice Base value for 1e2 (100)
 * @dev Used for percentage calculations and scaling
 * @custom:internal Used internally for mathematical operations
 */
const BASE_1E2: Int = 100;

/**
 * @notice Base value for 1e3 (1000)
 * @dev Used for fee calculations and scaling
 * @custom:internal Used internally for mathematical operations
 */
const BASE_1E3: Int = 1000;

/**
 * @notice Base value for 1e5 (100,000)
 * @dev Used for precision calculations and large number scaling
 * @custom:internal Used internally for mathematical operations
 */
const BASE_1E5: Int = 100_000;

/**
 * @notice EVM Chain IDs for supported networks
 * @dev Used for chain validation and routing
 * @custom:security Only supported chains are allowed
 */
const EVM_CHAIN_ETHEREUM: Int = 1;
const EVM_CHAIN_POLYGON: Int = 137;
const EVM_CHAIN_BSC: Int = 56;
const EVM_CHAIN_BASE: Int = 8453;
const EVM_CHAIN_ARBITRUM: Int = 42161;

/**
 * @notice TON Chain IDs
 * @dev Used for chain validation and routing
 * @custom:security Only supported chains are allowed
 */
const TON_CHAIN_MAINNET: Int = -3;
const TON_CHAIN_TESTNET: Int = -239;

/**
 * @notice Swap direction constants
 * @dev Used for determining swap type and routing
 * @custom:internal Used for order direction determination
 */
const SWAP_DIRECTION_TON_TO_EVM: Int = 0;
const SWAP_DIRECTION_EVM_TO_TON: Int = 1;
const SWAP_DIRECTION_TON_TO_TON: Int = 2;

/**
 * @notice EVM integration constants
 * @dev Used for cross-chain message handling and validation
 * @custom:internal Used for EVM contract interactions
 */
const EVM_MESSAGE_OPCODE: Int = 0x12345678;
const EVM_CONTRACT_CALL_GAS_LIMIT: Int = 300000;
const EVM_CONTRACT_DEPLOY_GAS_LIMIT: Int = 500000;
const EVM_BRIDGE_TIMEOUT_SECONDS: Int = 3600; // 1 hour
const EVM_CONFIRMATION_BLOCKS: Int = 12; // Standard confirmation blocks

/**
 * @notice EVM bridge and retry constants
 * @dev Used for bridge failure handling and retry logic
 * @custom:internal Used for cross-chain reliability
 */
const EVM_MAX_RETRY_ATTEMPTS: Int = 3;
const EVM_RETRY_DELAY_SECONDS: Int = 300; // 5 minutes
const EVM_BRIDGE_FEE_BASE: Int = ton("0.01"); // Base bridge fee
const EVM_GAS_PRICE_MULTIPLIER: Int = 110; // 110% of base gas price

/**
 * @notice Circuit breaker constants
 * @dev Used for circuit breaker implementation
 * @custom:internal Used for failure prevention
 */
const CIRCUIT_BREAKER_FAILURE_THRESHOLD: Int = 5;
const CIRCUIT_BREAKER_RESET_TIMEOUT: Int = 3600; // 1 hour
const CIRCUIT_BREAKER_HALF_OPEN_TIMEOUT: Int = 1800; // 30 minutes

/**
 * @notice Timeout handling constants
 * @dev Used for timeout processing and escalation
 * @custom:internal Used for timeout management
 */
const TIMEOUT_ESCALATION_LEVEL_1: Int = 1800; // 30 minutes
const TIMEOUT_ESCALATION_LEVEL_2: Int = 3600; // 1 hour
const TIMEOUT_ESCALATION_LEVEL_3: Int = 7200; // 2 hours

/**
 * @notice Gas estimation constants
 * @dev Used for dynamic gas calculation
 * @custom:internal Used for gas optimization
 */
const GAS_ESTIMATION_BUFFER: Int = 120; // 120% buffer
const GAS_PRICE_PRIORITY_LOW: Int = 0;
const GAS_PRICE_PRIORITY_MEDIUM: Int = 1;
const GAS_PRICE_PRIORITY_HIGH: Int = 2;

/**
 * @notice Error codes for chain validation
 * @dev Used for identifying specific validation failures
 * @custom:security Error codes help identify validation issues
 */
// Note: These error codes are now defined in errors.tact
// const INVALID_CHAIN_ID: Int = 1001;
// const ESCROW_NOT_DEPLOYED: Int = 1002;
// const CHAIN_NOT_ACTIVE: Int = 1003;
// const CHAIN_NOT_CONNECTED: Int = 1004;
// const INVALID_EVM_MESSAGE: Int = 1005;
// const BRIDGE_FAILURE: Int = 1006;
// const TIMEOUT_ERROR: Int = 1007;


