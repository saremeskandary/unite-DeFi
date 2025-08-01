import "./states.tact";

// Cross-chain order messages
message(0xf512f7df) LockJetton {
    orderConfig: OrderConfig;
    jetton: Cell;
    customPayload: Cell?;
}

message(0x7362d09c) CreateOrder {
    orderConfig: Order;
    jetton: Cell;
    customPayload: Cell?;
}

// Bi-directional swap messages
message(0x8b341822) CreateEVMToTONOrder {
    orderConfig: OrderConfig;
    evmContractAddress: Address;
    customPayload: Cell?;
}

message(0x62239978) CreateTONToEVMOrder {
    orderConfig: OrderConfig;
    targetChainId: Int as uint32;
    customPayload: Cell?;
}

// Partial fill messages
message(0x4ef5cb26) PartialFill {
    orderHash: Int as uint256;
    secret: Int as uint256;
    fillAmount: Int as uint64;
    resolver: Address;
    customPayload: Cell?;
}

message(0x8b341823) CompletePartialFill {
    orderHash: Int as uint256;
    secret: Int as uint256;
    customPayload: Cell?;
}

// Escrow factory messages
message(0x595f07bc) DeployEscrow {
    chainId: Int as uint32;
    targetAddress: Address;
    customPayload: Cell?;
}

message(0x7bdd97de) EscrowDeployed {
    chainId: Int as uint32;
    contractAddress: Address;
    success: Bool;
    customPayload: Cell?;
}

// Relayer/Resolver messages
message(0x7362d09e) RegisterRelayer {
    relayer: Address;
    customPayload: Cell?;
}

message(0x7362d09f) UpdateRelayerStats {
    relayer: Address;
    success: Bool;
    customPayload: Cell?;
}

// Fund management messages
message(0x50635fd2) GetFund {
    secret: Int as uint256;
    hash: Int as uint256;
    customPayload: Cell?;
}

message(0xe49e1dcb) Refund {
    hash: Int as uint256;
    customPayload: Cell?;
}

message(0x7362d09d) RefundOrder {
    hash: Int as uint256;
    customPayload: Cell?;
}

// Whitelist management
message(0xa985fdf8) SetWhiteList {
    resolver: Address;
    whitelistStatus: Bool;
}

// Jetton notification with action
message(0x7362d09c) JettonNotifyWithActionRequest {
    queryId: Int as uint64;
    amount: Int as coins;
    sender: Address;
    actionOpcode: Int as uint32;
    actionPayload: Cell; // Obligatory ref
}

message(0x2fcb26a2) GetWalletAddress {
    queryId: Int;
    owner: Address;
}




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
