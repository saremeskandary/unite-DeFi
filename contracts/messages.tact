import "./states.tact";



message(0xf512f7df) LockJetton {
    orderConfig: OrderConfig;
    jetton: Cell;
    customPayload: Cell?;
    
}

message(0x50635fd2) GetFund {
    secret: Int as uint256;
    hash: Int as uint256;
    customPayload: Cell?;
    
}
message(0xe49e1dcb) Refund {
    hash: Int as uint256;
    customPayload: Cell?;
    
}



message(0xa985fdf8) SetWhiteList {
    
    resolver: Address;
    whitelistStatus:Bool;
}


message(0x7362d09c) JettonNotifyWithActionRequest {
    queryId: Int as uint64;
    amount: Int as coins;
    sender: Address;
    actionOpcode: Int as uint32;
    actionPayload: Cell; // Obligatory ref
}

message(0x2fcb26a2) GetWalletAddress  {
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
