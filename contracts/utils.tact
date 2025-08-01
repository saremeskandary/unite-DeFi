import "./states.tact";

/**
 * @title TonFusion Utilities
 * @author TonFusion Team
 * @notice Utility functions and helpers for the TonFusion HTLC protocol
 * @dev Provides common functionality used across the protocol
 * 
 * @custom:version 1.0.0
 * 
 * Utility Categories:
 * - Jetton wallet management
 * - Cryptographic functions
 * - Chain validation
 * - Order processing
 * - Serialization helpers
 */

/**
 * @notice Jetton transfer message for internal transfers
 * @dev Used for sending jettons between contracts
 * @param queryId Unique query identifier
 * @param amount Amount of jettons to transfer
 * @param destination Destination address
 * @param responseDestination Optional response destination
 * @param customPayload Optional custom payload
 * @param forwardTonAmount Amount of TON to forward
 * @param forwardPayload Forward payload data
 * @custom:opcode 0xf8a7ea5
 */
message(0xf8a7ea5) SendViaJettonTransfer {
    queryId: Int as uint64;
    amount: Int as coins;
    destination: Address;
    responseDestination: Address?;
    customPayload: Cell?;
    forwardTonAmount: Int as coins;
    forwardPayload: Slice as remaining;
}

/**
 * @notice Calculate jetton wallet address using RUNVM
 * @dev Improved calculation using RUNVM for better compatibility
 * @param owner Owner address for the jetton wallet
 * @param jettonData Jetton data cell
 * @param jettonCode Jetton wallet code cell
 * @param jettonMaster Jetton master contract address
 * @return Calculated jetton wallet address
 * @custom:internal This is an internal utility function
 */
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

/**
 * @notice Calculate jetton wallet address (fallback method)
 * @dev Fallback calculation for compatibility with older jetton standards
 * @param ownerAddress Owner address for the jetton wallet
 * @param jettonMasterAddress Jetton master contract address
 * @param jettonWalletCode Jetton wallet code cell
 * @return Calculated jetton wallet address
 * @custom:internal This is an internal utility function
 */
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

/**
 * @notice Enhanced hash function for HTLC
 * @dev Generates keccak256 hash of a secret for hashlock creation
 * @param secret The secret to hash
 * @return Hash of the secret (hashlock)
 * @custom:security This function is critical for HTLC security
 */
fun keccakBytes32(secret: Int): Int {
    let cell: Cell = beginCell()
        .storeUint(secret, 256)
        .endCell();
    return cell.hash();
}

/**
 * @notice Generate multiple secrets for partial fills
 * @dev Creates a map of partial secrets for large order splitting
 * @param baseSecret Base secret to derive from
 * @param count Number of partial secrets to generate
 * @return Map of partial hash to partial secret
 * @custom:internal Used for partial fill functionality
 */
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

/**
 * @notice Validate chain ID for supported networks
 * @dev Checks if a chain ID is supported by the protocol
 * @param chainId Chain ID to validate
 * @return True if chain ID is supported, false otherwise
 * @custom:security Only supported chains are allowed
 */
fun isValidChainId(chainId: Int): Bool {
    return chainId == 1 || // Ethereum
           chainId == 137 || // Polygon
           chainId == 56 || // BSC
           chainId == 8453 || // Base
           chainId == 42161 || // Arbitrum
           chainId == -3 || // TON Mainnet
           chainId == -239; // TON Testnet
}

/**
 * @notice Calculate swap direction based on chain IDs
 * @dev Determines the type of swap based on source and destination chains
 * @param fromChainId Source chain ID
 * @param toChainId Destination chain ID
 * @return Swap direction constant (TON_TO_EVM, EVM_TO_TON, or TON_TO_TON)
 * @custom:internal Used for order direction determination
 */
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

/**
 * @notice Calculate timelock based on chain and direction
 * @dev Sets appropriate timelock duration based on swap type
 * @param chainId Target chain ID
 * @param direction Swap direction
 * @return Calculated timelock timestamp
 * @custom:internal Used for order timelock calculation
 */
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

/**
 * @notice Validate order parameters
 * @dev Checks if order parameters are valid
 * @param order Order configuration to validate
 * @return True if order is valid, false otherwise
 * @custom:security Critical for order validation
 */
fun validateOrder(order: OrderConfig): Bool {
    return order.amount > 0 &&
           order.timelock > now() &&
           isValidChainId(order.id) &&
           order.hashlock != 0;
}

/**
 * @notice Calculate fees based on order size and direction
 * @dev Determines appropriate fees for different swap types
 * @param amount Order amount
 * @param direction Swap direction
 * @return Calculated fee amount
 * @custom:internal Used for fee calculation
 */
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

/**
 * @notice Calculate price for jetton forward
 * @dev Determines the cost of forwarding jettons
 * @param fwdFee Forward fee
 * @param fwdTonAmount Forward TON amount
 * @return Calculated forward price
 * @custom:internal Used for jetton transfer pricing
 */
inline fun priceOfJettonForward(fwdFee: Int, fwdTonAmount: Int): Int {
    return
        fwdTonAmount +
        2 * fwdFee +
        getForwardFee(40, 30000, false) +
        (2 * getComputeFee(30000, false) +
         ton("0.02"));
}

/**
 * @notice Enhanced serialization for OrderConfig with partial fills
 * @dev Serializes OrderConfig with secret for transfer
 * @param order Order configuration to serialize
 * @param secret Secret for the order
 * @return Serialized order cell
 * @custom:internal Used for order data serialization
 */
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

/**
 * @notice Enhanced serialization for Order with partial fills
 * @dev Serializes Order with secret for transfer
 * @param order Order to serialize
 * @param secret Secret for the order
 * @return Serialized order cell
 * @custom:internal Used for order data serialization
 */
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

/**
 * @notice Serialize escrow contract data
 * @dev Serializes EscrowContract for storage
 * @param escrow Escrow contract data to serialize
 * @return Serialized escrow contract cell
 * @custom:internal Used for escrow data serialization
 */
inline fun serializeEscrowContract(escrow: EscrowContract): Cell {
    return beginCell()
        .storeUint(escrow.chainId, 32)
        .storeAddress(escrow.contractAddress)
        .storeBool(escrow.deployed)
        .storeUint(escrow.totalOrders, 32)
        .endCell();
}

/**
 * @notice Serialize relayer data
 * @dev Serializes RelayerData for storage
 * @param relayer Relayer data to serialize
 * @return Serialized relayer data cell
 * @custom:internal Used for relayer data serialization
 */
inline fun serializeRelayerData(relayer: RelayerData): Cell {
    return beginCell()
        .storeAddress(relayer.address)
        .storeBool(relayer.whitelisted)
        .storeUint(relayer.totalResolves, 32)
        .storeUint(relayer.successRate, 16)
        .endCell();
}