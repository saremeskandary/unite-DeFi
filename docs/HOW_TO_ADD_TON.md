# How to Add TON Functionality to the Unite-DeFi Resolver

This guide outlines the technical steps required to integrate TON HTLC (Hashed Time-Lock Contract) functionality into the off-chain resolver service. The primary tools for this are the TON SDK libraries, which allow for the creation and management of TON smart contracts and transactions in a Node.js environment.

---

## Token Flow Overview

This system enables atomic swaps between **ERC20 tokens (like WBTC) on Ethereum** and **native TON**. Here's how the token flow works:

### Swap Direction: ERC20 → Native TON

1. **User locks ERC20 tokens** (e.g., WBTC) in Ethereum escrow contract
2. **Resolver locks native TON** in TON HTLC smart contract
3. **User reveals secret** to claim TON from TON HTLC
4. **Resolver uses secret** to claim ERC20 tokens from Ethereum escrow

### Swap Direction: Native TON → ERC20

1. **User locks native TON** in TON HTLC smart contract
2. **Resolver locks ERC20 tokens** in Ethereum escrow contract
3. **Resolver reveals secret** to claim TON from TON HTLC
4. **User uses secret** to claim ERC20 tokens from Ethereum escrow

### Why Native TON, not WTON on Ethereum?

- **TON doesn't have native ERC20 tokens**: TON blockchain has its own token standards (TEP-74)
- **WTON exists only on Ethereum**: WTON is an ERC20 token that represents TON, but it's only available on Ethereum
- **Resolver provides liquidity**: The resolver must have both ERC20 tokens and native TON to facilitate swaps
- **True cross-chain**: This enables genuine cross-chain swaps, not just token-to-token swaps on the same chain

### Resolver Liquidity Requirements

The resolver needs to maintain balances on both chains:

```typescript
interface ResolverBalances {
  ethereum: {
    wbtc: number; // WBTC balance for TON→ERC20 swaps
    weth: number; // WETH balance for ETH→ERC20 swaps
    stake: number; // Staked ETH for deposit safety
  };
  ton: {
    ton: number; // Native TON balance for ERC20→TON swaps
  };
}
```

---

## Prerequisites

Before you begin, ensure your resolver project has the necessary dependencies:

- **Node.js**: The runtime environment for the resolver.
- **TON SDK**: The core libraries for TON smart contracts and transactions.
- **`axios` or similar**: For interacting with TON blockchain APIs.
- A TON wallet for the resolver with some testnet TON.

Install the required libraries:

```bash
npm install ton ton-core ton-crypto
```

---

## Step 1: Configure TON Network and Wallet

First, set up the TON network (we'll use testnet) and the resolver's wallet.

```typescript
import { TonClient, WalletContractV4, internal } from "ton";
import { mnemonicToPrivateKey } from "ton-crypto";

// 1. Define the network
const client = new TonClient({
  endpoint: "https://testnet.toncenter.com/api/v2/jsonRPC",
});

// 2. Load the resolver's wallet
// (Best practice: use a mnemonic string from environment variables)
const resolverMnemonic = process.env.TON_MNEMONIC;
if (!resolverMnemonic) {
  throw new Error("TON mnemonic is not set!");
}

const keyPair = await mnemonicToPrivateKey(resolverMnemonic.split(" "));
const wallet = WalletContractV4.create({
  workchain: 0,
  publicKey: keyPair.publicKey,
});

const resolverTonAddress = wallet.address.toString();

console.log(`Resolver TON Address: ${resolverTonAddress}`);
```

## Step 2: Create the HTLC Smart Contract

The core of the atomic swap is the HTLC smart contract. This contract defines the conditions for spending the locked TON.

### HTLC Smart Contract Structure (FunC)

```func
;; HTLC Smart Contract for TON Atomic Swaps
;; TEP-74 compliant

#include "stdlib.fc";

;; Contract storage
global int seqno;
global cell data;

;; HTLC parameters
global slice recipient_address;
global int amount;
global int hashlock;
global int timelock;
global slice funder_address;

;; Initialize contract
() load_data() impure inline {
    var ds = get_data().begin_parse();
    seqno = ds~load_uint(32);
    data = ds~load_ref();

    var data_ds = data.begin_parse();
    recipient_address = data_ds~load_ref().begin_parse();
    amount = data_ds~load_uint(128);
    hashlock = data_ds~load_uint(256);
    timelock = data_ds~load_uint(64);
    funder_address = data_ds~load_ref().begin_parse();
    ds.end_parse();
}

;; Save contract data
() save_data() impure inline {
    set_data(begin_cell()
        .store_uint(seqno, 32)
        .store_ref(begin_cell()
            .store_ref(begin_cell().store_slice(recipient_address).end_cell())
            .store_uint(amount, 128)
            .store_uint(hashlock, 256)
            .store_uint(timelock, 64)
            .store_ref(begin_cell().store_slice(funder_address).end_cell())
            .end_cell())
        .end_cell());
}

;; Withdraw with preimage
() withdraw(slice preimage) impure {
    load_data();

    ;; Verify preimage hash
    var preimage_hash = begin_cell().store_slice(preimage).end_cell().begin_parse()~load_uint(256);
    throw_if(36, preimage_hash != hashlock);

    ;; Send TON to recipient
    var msg = begin_cell()
        .store_uint(0x18, 6)
        .store_slice(recipient_address)
        .store_coins(amount)
        .store_uint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1)
        .end_cell();

    send_raw_message(msg, 64);

    ;; Self-destruct
    selfdestruct();
}

;; Refund after timelock
() refund() impure {
    load_data();

    ;; Check timelock
    throw_if(37, now() < timelock);

    ;; Send TON back to funder
    var msg = begin_cell()
        .store_uint(0x18, 6)
        .store_slice(funder_address)
        .store_coins(amount)
        .store_uint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1)
        .end_cell();

    send_raw_message(msg, 64);

    ;; Self-destruct
    selfdestruct();
}

;; Getter methods
int get_hashlock() method_id {
    load_data();
    return hashlock;
}

int get_timelock() method_id {
    load_data();
    return timelock;
}

slice get_recipient() method_id {
    load_data();
    return recipient_address;
}

slice get_funder() method_id {
    load_data();
    return funder_address;
}

int get_amount() method_id {
    load_data();
    return amount;
}

;; Main entry point
() recv_internal(int my_balance, int msg_value, cell in_msg_full, slice in_msg_body) impure {
    if (in_msg_body.slice_empty?()) {
        return ();
    }

    load_data();

    var op = in_msg_body~load_uint(32);

    if (op == 0x595f07bc) { ;; withdraw
        var preimage = in_msg_body;
        withdraw(preimage);
    } elseif (op == 0x0e565352) { ;; refund
        refund();
    } else {
        throw(0xffff);
    }
}
```

### Deploy HTLC Contract

```typescript
import { TonClient, WalletContractV4, internal } from "ton";
import { compile } from "ton-compiler";

async function deployHtlcContract(
  client: TonClient,
  wallet: WalletContractV4,
  recipientAddress: string,
  amount: bigint,
  hashlock: bigint,
  timelock: number
): Promise<string> {
  // Compile the contract
  const contractCode = await compile("contracts/htlc.fc");

  // Prepare contract data
  const contractData = begin_cell()
    .store_ref(
      begin_cell()
        .store_slice(Address.parse(recipientAddress).toSlice())
        .end_cell()
    )
    .store_uint(amount, 128)
    .store_uint(hashlock, 256)
    .store_uint(timelock, 64)
    .store_ref(begin_cell().store_slice(wallet.address.toSlice()).end_cell())
    .end_cell();

  // Deploy contract
  const contract = client.open(
    Contract.createFromConfig(
      {
        code: contractCode,
        data: contractData,
      },
      contractCode
    )
  );

  // Send deployment transaction
  const seqno = await wallet.getSeqno();
  await wallet.sendTransfer({
    secretKey: keyPair.secretKey,
    seqno: seqno,
    messages: [
      internal({
        to: contract.address,
        value: amount + 50000000n, // Amount + deployment fee
        body: "deploy", // Deployment message
      }),
    ],
  });

  return contract.address.toString();
}
```

## Step 2.5: Deposit Safety and Resolver Incentives

To ensure the resolver acts honestly and doesn't abandon swaps, we need to implement deposit safety mechanisms:

### Resolver Stake Requirements

```typescript
interface ResolverConfig {
  minStakeAmount: number; // Minimum ETH stake required
  stakeToken: string; // ERC20 token for staking (e.g., WETH)
  slashingPercentage: number; // Percentage of stake to slash on failure
}

// Resolver must stake before participating
async function stakeResolver(
  resolverAddress: string,
  stakeAmount: number
): Promise<boolean> {
  // Call stake function on Ethereum contract
  const stakeTx = await escrowContract.stake({
    from: resolverAddress,
    value: stakeAmount,
  });
  return stakeTx.status === 1;
}
```

### Slashing Mechanism

If the resolver fails to complete a swap properly, their stake gets slashed:

```typescript
// Slash resolver stake on failure
async function slashResolver(swapId: string, reason: string): Promise<void> {
  const swap = await escrowContract.swaps(swapId);
  const slashAmount = (swap.stakeAmount * config.slashingPercentage) / 100;

  await escrowContract.slashStake(swapId, reason);

  // Stake goes to user as compensation
  await escrowContract.transferStakeToUser(swapId, swap.maker);
}
```

### Recovery Mechanisms

1. **Automatic Refund**: If timelock expires, user gets automatic refund
2. **Stake Compensation**: Slashed stake goes to affected users
3. **Anyone-can-claim**: On TON side, anyone can claim TON after timeout

### Resolver Incentives

- **Success Fee**: Resolver earns a percentage of the swap amount
- **Stake Return**: Successful resolvers get their stake back plus rewards
- **Reputation System**: Good resolvers get priority in future auctions

## Step 3: Fund the HTLC

Next, create and broadcast a transaction that sends TON to the HTLC smart contract.

```typescript
async function fundHtlc(
  client: TonClient,
  wallet: WalletContractV4,
  htlcAddress: string,
  amount: bigint
): Promise<string> {
  const seqno = await wallet.getSeqno();

  await wallet.sendTransfer({
    secretKey: keyPair.secretKey,
    seqno: seqno,
    messages: [
      internal({
        to: htlcAddress,
        value: amount,
        body: "fund", // Funding message
      }),
    ],
  });

  return "funded"; // Transaction hash would be returned
}
```

## Step 4: Monitor for the Secret

The resolver must monitor the TON blockchain to detect when the user calls the withdraw function on the HTLC contract. When they do, their transaction will contain the secret (`preimage`) in the message body.

```typescript
// Monitor HTLC contract for withdrawals
async function watchForSecret(htlcAddress: string): Promise<Buffer | null> {
  const contract = client.open(Address.parse(htlcAddress));

  // Get contract transactions
  const transactions = await client.getTransactions(contract.address, 10);

  for (const tx of transactions) {
    if (tx.in_msg?.body) {
      const body = tx.in_msg.body;

      // Check if this is a withdraw call (op = 0x595f07bc)
      if (body.startsWith("0x595f07bc")) {
        // Extract preimage from message body
        const preimage = body.slice(8); // Remove op code
        return Buffer.from(preimage, "hex");
      }
    }
  }

  return null;
}
```

Once the secret is extracted, the resolver can use it to complete the swap on the Ethereum side.

## Step 5: Handle Timelock Refunds

If the user never reveals the secret and the timelock expires, the resolver must reclaim its TON.

```typescript
async function refundHtlc(
  client: TonClient,
  htlcAddress: string
): Promise<string> {
  const contract = client.open(Address.parse(htlcAddress));

  // Check if timelock has expired
  const timelock = await contract.getTimelock();
  if (Date.now() / 1000 < timelock) {
    throw new Error("Timelock has not expired yet");
  }

  // Call refund function
  const seqno = await wallet.getSeqno();
  await wallet.sendTransfer({
    secretKey: keyPair.secretKey,
    seqno: seqno,
    messages: [
      internal({
        to: htlcAddress,
        value: 10000000n, // Gas fee
        body: "0x0e565352", // refund op code
      }),
    ],
  });

  return "refunded";
}
```

## Step 6: Integration with Resolver Service

### Create TON Integration Class

```typescript
export class TonIntegration {
  private client: TonClient;
  private wallet: WalletContractV4;
  private keyPair: any;

  constructor(mnemonic: string) {
    this.client = new TonClient({
      endpoint: "https://testnet.toncenter.com/api/v2/jsonRPC",
    });

    this.keyPair = mnemonicToPrivateKey(mnemonic.split(" "));
    this.wallet = WalletContractV4.create({
      workchain: 0,
      publicKey: this.keyPair.publicKey,
    });
  }

  async createHtlc(
    recipientAddress: string,
    amount: bigint,
    hashlock: bigint,
    timelock: number
  ): Promise<string> {
    return await deployHtlcContract(
      this.client,
      this.wallet,
      recipientAddress,
      amount,
      hashlock,
      timelock
    );
  }

  async fundHtlc(htlcAddress: string, amount: bigint): Promise<string> {
    return await fundHtlc(this.client, this.wallet, htlcAddress, amount);
  }

  async watchForSecret(htlcAddress: string): Promise<Buffer | null> {
    return await watchForSecret(htlcAddress);
  }

  async refundHtlc(htlcAddress: string): Promise<string> {
    return await refundHtlc(this.client, htlcAddress);
  }

  getAddress(): string {
    return this.wallet.address.toString();
  }
}
```

### Add to Resolver Service

```typescript
import { TonIntegration } from "./ton-integration";

export class ResolverService {
  private tonIntegration: TonIntegration;

  constructor() {
    this.tonIntegration = new TonIntegration(process.env.TON_MNEMONIC!);
  }

  async initiateTonSwap(
    userAddress: string,
    amount: bigint,
    hashlock: bigint,
    timelock: number
  ): Promise<SwapResult> {
    // Create HTLC contract
    const htlcAddress = await this.tonIntegration.createHtlc(
      userAddress,
      amount,
      hashlock,
      timelock
    );

    // Fund the HTLC
    await this.tonIntegration.fundHtlc(htlcAddress, amount);

    return {
      htlcAddress,
      status: "funded",
    };
  }

  async monitorTonSwap(htlcAddress: string): Promise<Buffer | null> {
    return await this.tonIntegration.watchForSecret(htlcAddress);
  }

  async refundTonSwap(htlcAddress: string): Promise<string> {
    return await this.tonIntegration.refundHtlc(htlcAddress);
  }
}
```

## Step 7: Error Handling and Edge Cases

### Network-Specific Considerations

```typescript
// TON-specific error handling
class TonError extends Error {
  constructor(message: string, public code: number) {
    super(message);
    this.name = "TonError";
  }
}

// Handle TON network issues
async function handleTonError(error: any): Promise<void> {
  if (error.code === "NETWORK_ERROR") {
    // Retry with exponential backoff
    await retryWithBackoff(async () => {
      return await performTonOperation();
    });
  } else if (error.code === "INSUFFICIENT_BALANCE") {
    // Fund the wallet
    await fundWallet();
  } else {
    throw new TonError(error.message, error.code);
  }
}
```

### Gas Optimization

```typescript
// Optimize gas usage for TON transactions
const gasEstimates = {
  deployHtlc: 50000000n,
  fundHtlc: 10000000n,
  withdraw: 15000000n,
  refund: 12000000n,
};

async function estimateGas(operation: string): Promise<bigint> {
  return gasEstimates[operation] || 10000000n;
}
```

## Step 8: Testing and Validation

### Unit Tests

```typescript
describe("TON Integration", () => {
  let tonIntegration: TonIntegration;

  beforeEach(() => {
    tonIntegration = new TonIntegration(testMnemonic);
  });

  it("should create HTLC contract", async () => {
    const htlcAddress = await tonIntegration.createHtlc(
      testRecipient,
      testAmount,
      testHashlock,
      testTimelock
    );

    expect(htlcAddress).toMatch(/^EQ/);
  });

  it("should fund HTLC contract", async () => {
    const result = await tonIntegration.fundHtlc(testHtlcAddress, testAmount);
    expect(result).toBe("funded");
  });

  it("should detect secret revelation", async () => {
    const secret = await tonIntegration.watchForSecret(testHtlcAddress);
    expect(secret).toBeInstanceOf(Buffer);
  });
});
```

### Integration Tests

```typescript
describe("TON-Ethereum Atomic Swap", () => {
  it("should complete ERC20 → TON swap", async () => {
    // 1. User locks ERC20 tokens
    await lockErc20Tokens(userAddress, amount);

    // 2. Resolver creates and funds TON HTLC
    const htlcAddress = await resolver.createTonHtlc(userAddress, amount);

    // 3. User reveals secret to claim TON
    await user.claimTon(htlcAddress, secret);

    // 4. Resolver uses secret to claim ERC20
    await resolver.claimErc20(secret);

    // Verify balances
    expect(await getTonBalance(userAddress)).toBe(amount);
    expect(await getErc20Balance(resolverAddress)).toBe(amount);
  });
});
```

## Step 9: Production Deployment

### Environment Configuration

```env
# TON Configuration
TON_MNEMONIC=your 24 word mnemonic here
TON_NETWORK=mainnet
TON_RPC_URL=https://toncenter.com/api/v2/jsonRPC

# Ethereum Configuration
ETH_PRIVATE_KEY=your ethereum private key
ETH_RPC_URL=https://mainnet.infura.io/v3/your-project-id

# Resolver Configuration
RESOLVER_STAKE_AMOUNT=1000000000000000000
RESOLVER_SLASHING_PERCENTAGE=50
```

### Monitoring and Logging

```typescript
import { Logger } from "./logger";

class TonMonitor {
  private logger: Logger;

  constructor() {
    this.logger = new Logger("TON_MONITOR");
  }

  async monitorSwaps(): Promise<void> {
    try {
      const activeSwaps = await this.getActiveSwaps();

      for (const swap of activeSwaps) {
        const secret = await this.tonIntegration.watchForSecret(
          swap.htlcAddress
        );

        if (secret) {
          this.logger.info(`Secret revealed for swap ${swap.id}`);
          await this.completeSwap(swap.id, secret);
        }

        // Check for expired timelocks
        if (await this.isTimelockExpired(swap.htlcAddress)) {
          this.logger.info(`Timelock expired for swap ${swap.id}`);
          await this.refundSwap(swap.id);
        }
      }
    } catch (error) {
      this.logger.error("Error monitoring swaps", error);
    }
  }
}
```

## Summary

This guide provides a comprehensive approach to integrating TON functionality into the Unite-DeFi resolver service. The key differences from Bitcoin integration are:

1. **Smart Contracts**: TON uses smart contracts instead of Bitcoin scripts
2. **Address Format**: TON uses EQ-prefixed addresses
3. **Gas Model**: TON has a different gas model than Bitcoin
4. **Block Time**: TON has ~5 second block time vs Bitcoin's ~10 minutes
5. **Development Tools**: TON SDK vs Bitcoin.js

The integration enables true cross-chain atomic swaps between ERC20 tokens on Ethereum and native TON, providing users with seamless cross-chain liquidity.

## Additional Resources

- [TON Documentation](https://ton.org/docs)
- [TON SDK](https://github.com/ton-community/ton)
- [FunC Language Reference](https://ton.org/docs/develop/func/overview)
- [1inch Fusion+ Documentation](https://docs.1inch.dev/)
