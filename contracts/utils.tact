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

// Improved jetton wallet address calculation using RUNVM (like tact-dex)
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

// Fallback calculation for compatibility
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

// Enhanced hash function for HTLC
fun keccakBytes32(secret: Int): Int {
    let cell: Cell = beginCell()
        .storeUint(secret, 256)
        .endCell();
    return cell.hash();
}

// Generate multiple secrets for partial fills
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

// Validate chain ID for supported networks
fun isValidChainId(chainId: Int): Bool {
    return chainId == 1 || // Ethereum
           chainId == 137 || // Polygon
           chainId == 56 || // BSC
           chainId == 8453 || // Base
           chainId == 42161 || // Arbitrum
           chainId == -3 || // TON Mainnet
           chainId == -239; // TON Testnet
}

// Calculate swap direction based on chain IDs
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

// Calculate timelock based on chain and direction
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

// Validate order parameters
fun validateOrder(order: OrderConfig): Bool {
    return order.amount > 0 &&
           order.timelock > now() &&
           isValidChainId(order.id) &&
           order.hashlock != 0;
}

// Calculate fees based on order size and direction
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

inline fun priceOfJettonForward(fwdFee: Int, fwdTonAmount: Int): Int {
    return
        fwdTonAmount +
        2 * fwdFee +
        getForwardFee(40, 30000, false) +
        (2 * getComputeFee(30000, false) +
         ton("0.02"));
}

// Enhanced serialization for OrderConfig with partial fills
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

// Enhanced serialization for Order with partial fills
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

// Serialize escrow contract data
inline fun serializeEscrowContract(escrow: EscrowContract): Cell {
    return beginCell()
        .storeUint(escrow.chainId, 32)
        .storeAddress(escrow.contractAddress)
        .storeBool(escrow.deployed)
        .storeUint(escrow.totalOrders, 32)
        .endCell();
}

// Serialize relayer data
inline fun serializeRelayerData(relayer: RelayerData): Cell {
    return beginCell()
        .storeAddress(relayer.address)
        .storeBool(relayer.whitelisted)
        .storeUint(relayer.totalResolves, 32)
        .storeUint(relayer.successRate, 16)
        .endCell();
}