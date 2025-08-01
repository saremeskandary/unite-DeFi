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
    evmContractAddress: Address;
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
    targetChainId: Int as uint32;
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
 * @param customPayload Optional custom payload for additional data
 * @custom:opcode 0x8b341823
 */
message(0x8b341823) CompletePartialFill {
    orderHash: Int as uint256;
    secret: Int as uint256;
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
