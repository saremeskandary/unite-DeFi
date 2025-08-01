


const JettonTransferGas: Int = ton("0.05");

struct CalculateOutput {
    protocolFeeAmount:Int as uint64;
    integratorFeeAmount:Int as uint64;
    outputAmount:Int as uint64;

}

struct PointAndTimeDelta {
    
    rateBump: Int as uint16 = 0;
    timeDelta: Int as uint16 = 0;

}


struct OrderConfig {
    id: Int as uint32;
    srcJettonAddress: Address;
    senderPubKey: Address;
    receiverPubKey: Address;
    hashlock: Int as uint256;
    timelock: Int as uint32;
    amount: Int as uint64;
    finalized: Bool=false;
    
}



// struct EscrowMapping { unbox: map<Int as uint256, Int as coins> }


struct JettonWalletData {
    balance: Int as coins;
    ownerAddress: Address;
    jettonMasterAddress: Address;
    jettonWalletCode: Cell;
}


