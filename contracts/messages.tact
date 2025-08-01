import "./states.tact";

/**
 * @title TonFusion Messages
 * @author TonFusion Team
 * @notice Message definitions for the TonFusion HTLC protocol
 * @dev All messages use specific opcodes for routing and validation
 * 
 * @custom:version 1.0.0
 * 
 * Message Categories:
 * - Cross-chain order messages (LockJetton, CreateOrder)
 * - Bi-directional swap messages (CreateEVMToTONOrder, CreateTONToEVMOrder)
 * - Partial fill messages (PartialFill, CompletePartialFill)
 * - Escrow factory messages (DeployEscrow, EscrowDeployed)
 * - Relayer/Resolver messages (RegisterRelayer, UpdateRelayerStats)
 * - Fund management messages (GetFund, Refund, RefundOrder)
 * - Access control messages (SetWhiteList)
 * - Jetton notification messages (JettonNotifyWithActionRequest)
 */

/**
 * @notice Lock jettons for cross-chain swap
 * @dev Used to lock jettons for TON → EVM swaps
 * @param orderConfig Order configuration with hashlock and timelock
 * @param jetton Jetton master contract data
 * @param customPayload Optional custom payload for additional data
 * @custom:opcode 0xf512f7df
 */
message(0xf512f7df) LockJetton {
    orderConfig: OrderConfig;
    jetton: Cell;
    customPayload: Cell?;
}

/**
 * @notice Create same-chain order for TON ↔ TON swaps
 * @dev Used for same-chain swaps within TON ecosystem
 * @param orderConfig Order configuration with hashlock and timelock
 * @param jetton Jetton master contract data
 * @param customPayload Optional custom payload for additional data
 * @custom:opcode 0x7362d09c
 */
message(0x7362d09c) CreateOrder {
    orderConfig: Order;
    jetton: Cell;
    customPayload: Cell?;
}

/**
 * @notice Create EVM → TON order
 * @dev Used for incoming swaps from EVM chains to TON
 * @param orderConfig Order configuration with hashlock and timelock
 * @param evmContractAddress Address of the EVM escrow contract
 * @param customPayload Optional custom payload for additional data
 * @custom:opcode 0x8b341822
 */
message(0x8b341822) CreateEVMToTONOrder {
    orderConfig: OrderConfig;
    evmContractAddress: Cell;
    customPayload: Cell?;
}

/**
 * @notice Create TON → EVM order
 * @dev Used for outgoing swaps from TON to EVM chains
 * @param orderConfig Order configuration with hashlock and timelock
 * @param targetChainId Target EVM chain ID
 * @param customPayload Optional custom payload for additional data
 * @custom:opcode 0x62239978
 */
message(0x62239978) CreateTONToEVMOrder {
    orderConfig: OrderConfig;
    evmContractAddress: Cell;
    customPayload: Cell?;
}

/**
 * @notice Create a partial fill for an order
 * @dev Allows multiple parties to fill parts of a large order
 * @param orderHash The hashlock of the order to partially fill
 * @param secret Unique secret for this partial fill
 * @param fillAmount Amount to fill in this partial
 * @param resolver Address of the relayer/resolver
 * @param customPayload Optional custom payload for additional data
 * @custom:opcode 0x4ef5cb26
 */
message(0x4ef5cb26) PartialFill {
    orderHash: Int as uint256;
    secret: Int as uint256;
    fillAmount: Int as uint64;
    resolver: Address;
    customPayload: Cell?;
}

/**
 * @notice Complete a partial fill using the secret
 * @dev Transfers the partial amount to the receiver
 * @param orderHash The hashlock of the order
 * @param secret The secret for the partial fill
 * @custom:opcode 0x7a7b8c9d
 */
message(0x7a7b8c9d) CompletePartialFill {
    orderHash: Int as uint256;
    secret: Int as uint256;
}

/**
 * @notice EVM cross-chain message for contract interactions
 * @dev Used for communicating with EVM chains via bridges/oracles
 * @param targetChainId Target EVM chain ID
 * @param targetContract Target EVM contract address
 * @param functionSelector EVM function selector (4 bytes)
 * @param parameters Function parameters encoded as bytes
 * @param gasLimit Gas limit for the EVM call
 * @param value ETH value to send with the call
 * @param customPayload Optional custom payload for additional data
 * @custom:opcode 0x9a8b7c6d
 */
message(0x9a8b7c6d) EVMCrossChainMessage {
    targetChainId: Int as uint32;
    targetContract: Cell; // Target contract address encoded as cell
    functionSelector: Int as uint32;
    parameters: Cell;
    gasLimit: Int as uint32;
    value: Int as uint64;
    customPayload: Cell?;
}

/**
 * @notice EVM contract deployment message
 * @dev Used for deploying escrow contracts on EVM chains
 * @param targetChainId Target EVM chain ID
 * @param contractBytecode EVM contract bytecode
 * @param constructorParams Constructor parameters encoded as bytes
 * @param gasLimit Gas limit for contract deployment
 * @param value ETH value to send with deployment
 * @param customPayload Optional custom payload for additional data
 * @custom:opcode 0x5e4f3d2c
 */
message(0x5e4f3d2c) EVMContractDeploy {
    targetChainId: Int as uint32;
    contractBytecode: Cell;
    constructorParams: Cell;
    gasLimit: Int as uint32;
    value: Int as uint64;
    customPayload: Cell?;
}

/**
 * @notice EVM bridge confirmation message
 * @dev Used for confirming cross-chain transfers via bridges
 * @param bridgeId Bridge identifier
 * @param transactionHash EVM transaction hash
 * @param blockNumber EVM block number
 * @param confirmations Number of confirmations received
 * @param customPayload Optional custom payload for additional data
 * @custom:opcode 0x1f2e3d4c
 */
message(0x1f2e3d4c) EVMBridgeConfirmation {
    bridgeId: Int as uint32;
    transactionHash: Cell;
    blockNumber: Int as uint64;
    confirmations: Int as uint32;
    customPayload: Cell?;
}

/**
 * @notice EVM oracle price update message
 * @dev Used for receiving price updates from EVM oracles
 * @param oracleId Oracle identifier
 * @param tokenAddress Token address on EVM chain
 * @param price Price in USD with 8 decimal precision
 * @param timestamp Price timestamp
 * @param customPayload Optional custom payload for additional data
 * @custom:opcode 0x8c9d0e1f
 */
message(0x8c9d0e1f) EVMOraclePriceUpdate {
    oracleId: Int as uint32;
    tokenAddress: Address;
    price: Int as uint64;
    timestamp: Int as uint32;
    customPayload: Cell?;
}

/**
 * @notice EVM chain validation message
 * @dev Used for validating EVM chain parameters
 * @param chainId EVM chain ID to validate
 * @param blockNumber Current block number on the chain
 * @param gasPrice Current gas price on the chain
 * @param customPayload Optional custom payload for additional data
 * @custom:opcode 0x2d3e4f5a
 */
message(0x2d3e4f5a) EVMChainValidation {
    chainId: Int as uint32;
    blockNumber: Int as uint64;
    gasPrice: Int as uint64;
    customPayload: Cell?;
}

/**
 * @notice Deploy escrow contract for a target chain
 * @dev Only callable by contract owner
 * @param chainId Target chain ID for escrow deployment
 * @param targetAddress Address where escrow should be deployed
 * @param customPayload Optional custom payload for additional data
 * @custom:opcode 0x595f07bc
 */
message(0x595f07bc) DeployEscrow {
    chainId: Int as uint32;
    targetAddress: Address;
    customPayload: Cell?;
}

/**
 * @notice Notification of escrow contract deployment
 * @dev Sent after successful escrow deployment
 * @param chainId Chain ID where escrow was deployed
 * @param contractAddress Address of the deployed escrow contract
 * @param success Whether deployment was successful
 * @param customPayload Optional custom payload for additional data
 * @custom:opcode 0x7bdd97de
 */
message(0x7bdd97de) EscrowDeployed {
    chainId: Int as uint32;
    contractAddress: Address;
    success: Bool;
    customPayload: Cell?;
}

/**
 * @notice Register a new relayer
 * @dev Only callable by contract owner
 * @param relayer Address of the relayer to register
 * @param customPayload Optional custom payload for additional data
 * @custom:opcode 0x7362d09e
 */
message(0x7362d09e) RegisterRelayer {
    relayer: Address;
    customPayload: Cell?;
}

/**
 * @notice Update relayer performance statistics
 * @dev Tracks success/failure rates for relayer reputation
 * @param relayer Address of the relayer
 * @param success True if resolution was successful
 * @param customPayload Optional custom payload for additional data
 * @custom:opcode 0x7362d09f
 */
message(0x7362d09f) UpdateRelayerStats {
    relayer: Address;
    success: Bool;
    customPayload: Cell?;
}

/**
 * @notice Claim funds using the correct secret
 * @dev Validates secret hash and transfers funds to receiver
 * @param secret The secret that unlocks the hashlock
 * @param hash The hashlock of the order
 * @param customPayload Optional custom payload for additional data
 * @custom:opcode 0x50635fd2
 */
message(0x50635fd2) GetFund {
    secret: Int as uint256;
    hash: Int as uint256;
    customPayload: Cell?;
}

/**
 * @notice Refund cross-chain order after timelock expiration
 * @dev Returns funds to original sender if order expires
 * @param hash The hashlock of the order to refund
 * @param customPayload Optional custom payload for additional data
 * @custom:opcode 0xe49e1dcb
 */
message(0xe49e1dcb) Refund {
    hash: Int as uint256;
    customPayload: Cell?;
}

/**
 * @notice Refund same-chain order after timelock expiration
 * @dev Returns funds to original sender if order expires
 * @param hash The hashlock of the order to refund
 * @param customPayload Optional custom payload for additional data
 * @custom:opcode 0x7362d09d
 */
message(0x7362d09d) RefundOrder {
    hash: Int as uint256;
    customPayload: Cell?;
}

/**
 * @notice Set whitelist status for an address
 * @dev Only callable by contract owner
 * @param resolver Address to set whitelist status for
 * @param whitelistStatus True to whitelist, false to remove from whitelist
 * @custom:opcode 0xa985fdf8
 */
message(0xa985fdf8) SetWhiteList {
    resolver: Address;
    whitelistStatus: Bool;
}

/**
 * @notice Jetton notification with embedded action
 * @dev Routes different action types to appropriate handlers
 * @param queryId Unique query identifier
 * @param amount Amount of jettons transferred
 * @param sender Address of the jetton sender
 * @param actionOpcode Opcode identifying the action type
 * @param actionPayload Encoded action data
 * @custom:opcode 0x7362d09c
 */
message(0x7362d09c) JettonNotifyWithActionRequest {
    queryId: Int as uint64;
    amount: Int as coins;
    sender: Address;
    actionOpcode: Int as uint32;
    actionPayload: Cell; // Obligatory ref
}

/**
 * @notice Get jetton wallet address
 * @dev Utility message for calculating jetton wallet addresses
 * @param queryId Unique query identifier
 * @param owner Owner address for the jetton wallet
 * @custom:opcode 0x2fcb26a2
 */
message(0x2fcb26a2) GetWalletAddress {
    queryId: Int;
    owner: Address;
}



// Commented out messages for future use or reference

// message(0x595f07bc) TokenBurn {
//     query_id: Int as uint64;
//     amount: Int as coins;
//     response_destination: Address?;
//     custom_payload: Cell?;
// }
// message(0x7bdd97de) TokenBurnNotification {
//     query_id: Int as uint64;
//     amount: Int as coins;
//     sender: Address;
//     response_destination: Address?;
// }

// message(0x7362d09c) JettonNotifyWithActionRequest {
//     queryId: Int as uint64;
//     amount: Int as coins;
//     sender: Address;
//     eitherBit: Bool; // Should be 0, so other fields are stored inline
//     actionOpcode: Int as uint32;
//     actionPayload: Cell; // Obligatory ref
// }

// message(0x7362d09c) TokenNotification {
//     query_id: Int as uint64;
//     amount: Int as coins;
//     from: Address;
//     forward_payload: Slice as remaining; // Comment Text message when Transfer the jetton 
// }

// message(0x4ef5cb26) ICOTokenBurn {
//     jettonAccount: Cell;
//     queryId: Int as uint64;
//     amount: Int as coins;
//     responseDestination: Address?;
//     customPayload: Cell?;
// }
// message(0x8b341822) Add {
//     queryId: Int as uint64;
//     amount: Int as uint32;
// }
// message(0x62239978) Buy {
//     user: Address;
//     amount: Int as coins;
// }

/**
 * @notice Register a new EVM bridge
 * @dev Only callable by contract owner
 * @param bridgeId Unique bridge identifier
 * @param sourceChainId Source chain ID
 * @param targetChainId Target chain ID
 * @param bridgeContract Bridge contract address
 * @param bridgeFee Bridge fee for transfers
 * @param minTransferAmount Minimum transfer amount
 * @param maxTransferAmount Maximum transfer amount
 * @param customPayload Optional custom payload for additional data
 * @custom:opcode 0x8a9b0c1d
 */
message(0x8a9b0c1d) RegisterEVMBridge {
    bridgeId: Int as uint32;
    sourceChainId: Int as uint32;
    targetChainId: Int as uint32;
    bridgeContract: Address;
    bridgeFee: Int as uint64;
    minTransferAmount: Int as uint64;
    maxTransferAmount: Int as uint64;
    customPayload: Cell?;
}

/**
 * @notice Update EVM bridge configuration
 * @dev Only callable by contract owner
 * @param bridgeId Bridge identifier to update
 * @param bridgeFee New bridge fee
 * @param minTransferAmount New minimum transfer amount
 * @param maxTransferAmount New maximum transfer amount
 * @param isActive Whether the bridge should be active
 * @param customPayload Optional custom payload for additional data
 * @custom:opcode 0x9b0c1d2e
 */
message(0x9b0c1d2e) UpdateEVMBridge {
    bridgeId: Int as uint32;
    bridgeFee: Int as uint64;
    minTransferAmount: Int as uint64;
    maxTransferAmount: Int as uint64;
    isActive: Bool;
    customPayload: Cell?;
}

/**
 * @notice Register a new EVM oracle
 * @dev Only callable by contract owner
 * @param oracleId Unique oracle identifier
 * @param chainId EVM chain ID where oracle operates
 * @param oracleContract Oracle contract address
 * @param tokenAddress Token address for price feed
 * @param priceDecimals Number of decimal places for price
 * @param heartbeatInterval Heartbeat interval for price updates
 * @param customPayload Optional custom payload for additional data
 * @custom:opcode 0x0c1d2e3f
 */
message(0x0c1d2e3f) RegisterEVMOracle {
    oracleId: Int as uint32;
    chainId: Int as uint32;
    oracleContract: Address;
    tokenAddress: Address;
    priceDecimals: Int as uint8;
    heartbeatInterval: Int as uint32;
    customPayload: Cell?;
}

/**
 * @notice Update EVM oracle configuration
 * @dev Only callable by contract owner
 * @param oracleId Oracle identifier to update
 * @param heartbeatInterval New heartbeat interval
 * @param isActive Whether the oracle should be active
 * @param customPayload Optional custom payload for additional data
 * @custom:opcode 0x1d2e3f4a
 */
message(0x1d2e3f4a) UpdateEVMOracle {
    oracleId: Int as uint32;
    heartbeatInterval: Int as uint32;
    isActive: Bool;
    customPayload: Cell?;
}

/**
 * @notice Process EVM bridge timeout
 * @dev Handles timeout scenarios for bridge operations
 * @param bridgeId Bridge identifier
 * @param transactionNonce Transaction nonce that timed out
 * @param customPayload Optional custom payload for additional data
 * @custom:opcode 0x2e3f4a5b
 */
message(0x2e3f4a5b) EVMBridgeTimeout {
    bridgeId: Int as uint32;
    transactionNonce: Int as uint64;
    customPayload: Cell?;
}

/**
 * @notice Retry failed EVM transaction
 * @dev Retries a failed cross-chain transaction
 * @param transactionNonce Transaction nonce to retry
 * @param newGasPrice New gas price for retry
 * @param customPayload Optional custom payload for additional data
 * @custom:opcode 0x3f4a5b6c
 */
message(0x3f4a5b6c) RetryEVMTransaction {
    transactionNonce: Int as uint64;
    newGasPrice: Int as uint64;
    customPayload: Cell?;
}
