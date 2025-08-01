


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

// Cross-chain order (TON ↔ EVM chains)
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

// Same-chain order (TON ↔ TON)
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

// Escrow contract data for target chains
struct EscrowContract {
    chainId: Int as uint32;
    contractAddress: Address;
    deployed: Bool = false;
    totalOrders: Int as uint32 = 0;
}

// Relayer/Resolver data
struct RelayerData {
    address: Address;
    whitelisted: Bool = false;
    totalResolves: Int as uint32 = 0;
    successRate: Int as uint16 = 0; // Percentage
}

// Swap direction constants
const TON_TO_EVM: Int = 0;
const EVM_TO_TON: Int = 1;
const TON_TO_TON: Int = 2;

// HTLC status constants
const HTLC_PENDING: Int = 0;
const HTLC_COMPLETED: Int = 1;
const HTLC_EXPIRED: Int = 2;
const HTLC_REFUNDED: Int = 3;

struct JettonWalletData {
    balance: Int as coins;
    ownerAddress: Address;
    jettonMasterAddress: Address;
    jettonWalletCode: Cell;
}


