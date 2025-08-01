/**
 * @title TonFusion Error Codes
 * @author TonFusion Team
 * @notice Error code definitions for the TonFusion HTLC protocol
 * @dev All error codes are unique integers used for error handling and debugging
 * 
 * @custom:version 1.0.0
 * 
 * Error Categories:
 * - Validation errors (70-89)
 * - Order management errors (90-104)
 * - Access control errors (85-87)
 * - System errors (96-104)
 * 
 * @custom:warning Error codes are critical for debugging. Always check error codes in logs
 */

// ============================================================================
// VALIDATION ERRORS (70-89)
// ============================================================================

/// @notice Inconsistent native source trait error
/// @dev Used when source token validation fails
const INCONSISTENT_NATIVE_SRC_TRAIT: Int = 70;

/// @notice Inconsistent native destination trait error
/// @dev Used when destination token validation fails
const INCONSISTENT_NATIVE_DST_TRAIT: Int = 71;

/// @notice Invalid amount error
/// @dev Used when order amount is zero or exceeds limits
const INVALID_AMOUNT: Int = 72;

/// @notice Missing maker destination associated token account
/// @dev Used when maker's destination token account is not found
const MISSING_MAKER_DST_ATA: Int = 73;

/// @notice Not enough tokens in escrow
/// @dev Used when escrow balance is insufficient for the order
const NOT_ENOUGH_TOKENS_IN_ESCROW: Int = 74;

/// @notice Order expired error
/// @dev Used when order timelock has passed
const ORDER_EXPIRED: Int = 75;

/// @notice Invalid estimated taking amount
/// @dev Used when estimated fill amount is invalid
const INVALID_ESTIMATED_TAKING_AMOUNT: Int = 76;

/// @notice Invalid protocol surplus fee
/// @dev Used when protocol fee calculation is invalid
const INVALID_PROTOCOL_SURPLUS_FEE: Int = 77;

/// @notice Inconsistent protocol fee configuration
/// @dev Used when protocol fee settings are inconsistent
const INCONSISTENT_PROTOCOL_FEE_CONFIG: Int = 78;

/// @notice Inconsistent integrator fee configuration
/// @dev Used when integrator fee settings are inconsistent
const INCONSISTENT_INTEGRATOR_FEE_CONFIG: Int = 79;

/// @notice Order not expired error
/// @dev Used when trying to refund before timelock expiration
const ORDER_NOT_EXPIRED: Int = 80;

/// @notice Invalid cancellation fee
/// @dev Used when cancellation fee is invalid
const INVALID_CANCELLATION_FEE: Int = 81;

/// @notice Cancel order by resolver is forbidden
/// @dev Used when resolver tries to cancel an order they shouldn't
const CANCEL_ORDER_BY_RESOLVER_IS_FORBIDDEN: Int = 82;

/// @notice Missing taker destination associated token account
/// @dev Used when taker's destination token account is not found
const MISSING_TAKER_DST_ATA: Int = 83;

/// @notice Missing maker source associated token account
/// @dev Used when maker's source token account is not found
const MISSING_MAKER_SRC_ATA: Int = 84;

/// @notice Invalid recipient error
/// @dev Used when recipient address is invalid
const INVALID_RECIPIENT: Int = 85;

/// @notice Invalid chain ID error
/// @dev Used when EVM chain ID is not supported
const INVALID_CHAIN_ID: Int = 88;

/// @notice Invalid bridge configuration error
/// @dev Used when bridge configuration is missing or invalid
const INVALID_BRIDGE_CONFIG: Int = 89;

/// @notice Invalid oracle configuration error
/// @dev Used when oracle configuration is missing or invalid
const INVALID_ORACLE_CONFIG: Int = 90;

/// @notice EVM transaction failed error
/// @dev Used when EVM transaction execution fails
const EVM_TRANSACTION_FAILED: Int = 91;

/// @notice EVM bridge timeout error
/// @dev Used when EVM bridge operation times out
const EVM_BRIDGE_TIMEOUT: Int = 92;

/// @notice EVM gas limit exceeded error
/// @dev Used when EVM transaction gas limit is exceeded
const EVM_GAS_LIMIT_EXCEEDED: Int = 93;

/// @notice EVM insufficient balance error
/// @dev Used when insufficient balance for EVM operation
const EVM_INSUFFICIENT_BALANCE: Int = 94;

/// @notice EVM contract not found error
/// @dev Used when target EVM contract is not found
const EVM_CONTRACT_NOT_FOUND: Int = 95;

/// @notice Escrow contract not deployed error
/// @dev Used when escrow contract is not deployed on target chain
const ESCROW_NOT_DEPLOYED: Int = 106;

/// @notice Cross-chain bridge failure error
/// @dev Used when cross-chain bridge operation fails
const BRIDGE_FAILURE: Int = 107;

/// @notice Message delivery failed error
/// @dev Used when cross-chain message delivery fails
const MESSAGE_DELIVERY_FAILED: Int = 108;

/// @notice Invalid EVM message format error
/// @dev Used when EVM message format is invalid
const INVALID_EVM_MESSAGE: Int = 109;

// ============================================================================
// ACCESS CONTROL ERRORS (85-87)
// ============================================================================

/// @notice Invalid owner error
/// @dev Used when caller is not the contract owner
const INVALID_OWNER: Int = 86;

/// @notice Invalid whitelist error
/// @dev Used when caller is not whitelisted
const INVALID_WHITELIST: Int = 87;

// ============================================================================
// ORDER MANAGEMENT ERRORS (88-104)
// ============================================================================

/// @notice Invalid hash error
/// @dev Used when order hash is not found
const INVALID_HASH: Int = 88;

/// @notice Invalid secret error
/// @dev Used when secret hash doesn't match hashlock
const INVALID_SECRET: Int = 89;

/// @notice Order already exists error
/// @dev Used when trying to create duplicate order
const ORDER_ALREADY_EXISTS: Int = 90;

/// @notice Order already finalized error
/// @dev Used when trying to modify a completed/refunded order
const ORDER_ALREADY_FINALIZED: Int = 91;

/// @notice Invalid swap direction error
/// @dev Used when swap direction is not supported
const INVALID_SWAP_DIRECTION: Int = 92;

/// @notice Invalid partial fill error
/// @dev Used when partial fill parameters are invalid
const INVALID_PARTIAL_FILL: Int = 94;

/// @notice Order not partially filled error
/// @dev Used when trying to complete non-existent partial fill
const ORDER_NOT_PARTIALLY_FILLED: Int = 95;

/// @notice Invalid relayer error
/// @dev Used when relayer is not registered
const INVALID_RELAYER: Int = 96;

/// @notice Escrow deployment failed error
/// @dev Used when escrow contract deployment fails
const ESCROW_DEPLOYMENT_FAILED: Int = 97;

/// @notice Invalid escrow contract error
/// @dev Used when escrow contract is invalid
const INVALID_ESCROW_CONTRACT: Int = 98;

/// @notice Insufficient funds error
/// @dev Used when contract balance is insufficient
const INSUFFICIENT_FUNDS: Int = 99;

/// @notice Relayer not whitelisted error
/// @dev Used when relayer is not whitelisted
const RELAYER_NOT_WHITELISTED: Int = 100;

/// @notice Order already completed error
/// @dev Used when trying to complete an already completed order
const ORDER_ALREADY_COMPLETED: Int = 101;

/// @notice Invalid target chain error
/// @dev Used when target chain is not supported
const INVALID_TARGET_CHAIN: Int = 102;

/// @notice Partial fill exceeds order error
/// @dev Used when partial fill amount exceeds remaining order amount
const PARTIAL_FILL_EXCEEDS_ORDER: Int = 103;

/// @notice Secret already used error
/// @dev Used when trying to use a secret that has already been used
const SECRET_ALREADY_USED: Int = 104;

// ============================================================================
// BRIDGE AND ORACLE ERRORS (110-119)
// ============================================================================





/// @notice Invalid transaction error
/// @dev Used when transaction is not found or invalid
const INVALID_TRANSACTION: Int = 112;

/// @notice Invalid transaction status error
/// @dev Used when transaction status is not valid for operation
const INVALID_TRANSACTION_STATUS: Int = 113;

/// @notice Bridge timeout error
/// @dev Used when bridge operation times out
const BRIDGE_TIMEOUT: Int = 114;

/// @notice Oracle timeout error
/// @dev Used when oracle operation times out
const ORACLE_TIMEOUT: Int = 115;

/// @notice Invalid retry attempt error
/// @dev Used when retry attempt is invalid
const INVALID_RETRY_ATTEMPT: Int = 116;

/// @notice Chain not active error
/// @dev Used when EVM chain is not active
const CHAIN_NOT_ACTIVE: Int = 117;



/// @notice Invalid bridge fee error
/// @dev Used when bridge fee is invalid
const INVALID_BRIDGE_FEE: Int = 119;

// ============================================================================
// SYSTEM ERRORS
// ============================================================================

/// @notice Wrong operation error
/// @dev Used for invalid message opcodes
const WRONG_OP: Int = 0xffff;
