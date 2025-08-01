import "./states.tact";

message(0xf8a7ea5) SendViaJettonTransfer {
    queryId: Int as uint64;
    amount: Int as coins;
    destination: Address;
    responseDestination: Address?;
    customPayload: Cell?;
    forwardTonAmount: Int as coins;
    forwardPayload: Slice as remaining;
}

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
fun keccakBytes32(secret: Int): Int {
    // Store the integer in a cell and get its hash (SHA-256)
    let cell: Cell = beginCell()
        .storeUint(secret, 256)  // Store as 256-bit (32 bytes) unsigned integer
        .endCell();
    
    // Return the cell hash (SHA-256, which is TON's equivalent to Keccak-256)
    return cell.hash();
}





inline fun priceOfJettonForward(fwdFee: Int, fwdTonAmount: Int): Int {
    // We know nothing about the jetton, so let's just assume that it fits in some gas limits
    return
        fwdTonAmount +
    // Let's assume that we will always have a Jetton Notify
        2 * fwdFee +
    // I've never seen jetton that occupies more than that.
    // However it is easy to create one :)
        getForwardFee(40, 30000, false) +
    // I don't think there is a jetton that requires more than 30k gas to transfer
        (2 * getComputeFee(30000, false) +
    // I've seen that some jettons reserve 0.02 TON for storage so let's assume that
         ton("0.02"));
}

    inline fun serializeOrderConfig(order: OrderConfig,secret:Int): Cell {
        return beginCell()
            .storeUint(order.id, 32)
            .storeAddress(order.srcJettonAddress)
            .storeAddress(order.senderPubKey)
            .storeAddress(order.receiverPubKey)
            .storeUint(order.hashlock, 256)
            .storeUint(order.timelock, 32)
            .storeUint(order.amount, 64)
            .storeBool(order.finalized)
            .storeUint(secret,256)
            .endCell();
    }