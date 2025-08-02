# How to Add TRON Functionality to the Unite-DeFi Resolver

This guide outlines the technical steps required to integrate TRON HTLC (Hashed Time-Lock Contract) functionality into the off-chain resolver service. The primary tools for this are the TRON SDK libraries, which allow for the creation and management of TRON smart contracts and transactions in a Node.js environment.

---

## Token Flow Overview

This system enables atomic swaps between **ERC20 tokens (like WBTC) on Ethereum** and **native TRX**. Here's how the token flow works:

### Swap Direction: ERC20 → Native TRX

1. **User locks ERC20 tokens** (e.g., WBTC) in Ethereum escrow contract
2. **Resolver locks native TRX** in TRON HTLC smart contract
3. **User reveals secret** to claim TRX from TRON HTLC
4. **Resolver uses secret** to claim ERC20 tokens from Ethereum escrow

### Swap Direction: Native TRX → ERC20

1. **User locks native TRX** in TRON HTLC smart contract
2. **Resolver locks ERC20 tokens** in Ethereum escrow contract
3. **Resolver reveals secret** to claim TRX from TRON HTLC
4. **User uses secret** to claim ERC20 tokens from Ethereum escrow

### Why Native TRX, not WTRX on Ethereum?

- **TRON doesn't have native ERC20 tokens**: TRON blockchain has its own token standards (TRC-20)
- **WTRX exists only on Ethereum**: WTRX is an ERC20 token that represents TRX, but it's only available on Ethereum
- **Resolver provides liquidity**: The resolver must have both ERC20 tokens and native TRX to facilitate swaps
- **True cross-chain**: This enables genuine cross-chain swaps, not just token-to-token swaps on the same chain

### Resolver Liquidity Requirements

The resolver needs to maintain balances on both chains:

```typescript
interface ResolverBalances {
  ethereum: {
    wbtc: number; // WBTC balance for TRX→ERC20 swaps
    weth: number; // WETH balance for ETH→ERC20 swaps
    stake: number; // Staked ETH for deposit safety
  };
  tron: {
    trx: number; // Native TRX balance for ERC20→TRX swaps
  };
}
```

---

## Prerequisites

Before you begin, ensure your resolver project has the necessary dependencies:

- **Node.js**: The runtime environment for the resolver.
- **TRON SDK**: The core libraries for TRON smart contracts and transactions.
- **`axios` or similar**: For interacting with TRON blockchain APIs.
- A TRON wallet for the resolver with some testnet TRX.

Install the required libraries:

```bash
npm install tronweb @tronprotocol/tronweb crypto-js
```

---

## Step 1: Configure TRON Network and Wallet

First, set up the TRON network (we'll use testnet) and the resolver's wallet.

```typescript
import TronWeb from "tronweb";
import CryptoJS from "crypto-js";

// 1. Define the network
const tronWeb = new TronWeb({
  fullHost: "https://nile.trongrid.io", // Testnet
  privateKey: process.env.TRON_PRIVATE_KEY,
});

// 2. Load the resolver's wallet
// (Best practice: use a private key from environment variables)
const resolverPrivateKey = process.env.TRON_PRIVATE_KEY;
if (!resolverPrivateKey) {
  throw new Error("TRON private key is not set!");
}

const resolverAddress = tronWeb.address.fromPrivateKey(resolverPrivateKey);

console.log(`Resolver TRON Address: ${resolverAddress}`);
```

## Step 2: Create the HTLC Smart Contract

The core of the atomic swap is the HTLC smart contract. This contract defines the conditions for spending the locked TRX.

### HTLC Smart Contract Structure (Solidity)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract HTLC {
    struct Swap {
        bytes32 hashlock;
        address recipient;
        address sender;
        uint256 locktime;
        uint256 amount;
        bool withdrawn;
        bool refunded;
    }

    mapping(bytes32 => Swap) public swaps;

    event HTLCNew(
        bytes32 indexed contractId,
        address indexed sender,
        address indexed recipient,
        uint256 amount,
        uint256 locktime
    );

    event HTLCWithdraw(bytes32 indexed contractId);
    event HTLCRefund(bytes32 indexed contractId);

    function newContract(
        bytes32 _hashlock,
        address _recipient,
        uint256 _locktime
    ) external payable {
        require(msg.value > 0, "Amount must be greater than 0");
        require(_locktime > block.timestamp, "Locktime must be in the future");

        bytes32 contractId = keccak256(
            abi.encodePacked(msg.sender, _recipient, _hashlock, _locktime)
        );

        swaps[contractId] = Swap({
            hashlock: _hashlock,
            recipient: _recipient,
            sender: msg.sender,
            locktime: _locktime,
            amount: msg.value,
            withdrawn: false,
            refunded: false
        });

        emit HTLCNew(contractId, msg.sender, _recipient, msg.value, _locktime);
    }

    function withdraw(bytes32 _contractId, bytes32 _preimage) external {
        Swap storage swap = swaps[_contractId];
        require(swap.recipient == msg.sender, "Only recipient can withdraw");
        require(!swap.withdrawn, "Already withdrawn");
        require(!swap.refunded, "Already refunded");
        require(
            keccak256(abi.encodePacked(_preimage)) == swap.hashlock,
            "Invalid preimage"
        );

        swap.withdrawn = true;
        payable(msg.sender).transfer(swap.amount);

        emit HTLCWithdraw(_contractId);
    }

    function refund(bytes32 _contractId) external {
        Swap storage swap = swaps[_contractId];
        require(swap.sender == msg.sender, "Only sender can refund");
        require(!swap.withdrawn, "Already withdrawn");
        require(!swap.refunded, "Already refunded");
        require(block.timestamp >= swap.locktime, "Locktime not reached");

        swap.refunded = true;
        payable(msg.sender).transfer(swap.amount);

        emit HTLCRefund(_contractId);
    }

    function getSwap(bytes32 _contractId) external view returns (Swap memory) {
        return swaps[_contractId];
    }
}
```

### Deploy HTLC Contract

```typescript
import TronWeb from "tronweb";

async function deployHtlcContract(
  tronWeb: TronWeb,
  recipientAddress: string,
  amount: number,
  hashlock: string,
  timelock: number
): Promise<string> {
  // Compile the contract
  const contractCode = `
    // SPDX-License-Identifier: MIT
    pragma solidity ^0.8.0;
    
    contract HTLC {
        struct Swap {
            bytes32 hashlock;
            address recipient;
            address sender;
            uint256 locktime;
            uint256 amount;
            bool withdrawn;
            bool refunded;
        }
        
        mapping(bytes32 => Swap) public swaps;
        
        event HTLCNew(
            bytes32 indexed contractId,
            address indexed sender,
            address indexed recipient,
            uint256 amount,
            uint256 locktime
        );
        
        event HTLCWithdraw(bytes32 indexed contractId);
        event HTLCRefund(bytes32 indexed contractId);
        
        function newContract(
            bytes32 _hashlock,
            address _recipient,
            uint256 _locktime
        ) external payable {
            require(msg.value > 0, "Amount must be greater than 0");
            require(_locktime > block.timestamp, "Locktime must be in the future");
            
            bytes32 contractId = keccak256(
                abi.encodePacked(msg.sender, _recipient, _hashlock, _locktime)
            );
            
            swaps[contractId] = Swap({
                hashlock: _hashlock,
                recipient: _recipient,
                sender: msg.sender,
                locktime: _locktime,
                amount: msg.value,
                withdrawn: false,
                refunded: false
            });
            
            emit HTLCNew(contractId, msg.sender, _recipient, msg.value, _locktime);
        }
        
        function withdraw(bytes32 _contractId, bytes32 _preimage) external {
            Swap storage swap = swaps[_contractId];
            require(swap.recipient == msg.sender, "Only recipient can withdraw");
            require(!swap.withdrawn, "Already withdrawn");
            require(!swap.refunded, "Already refunded");
            require(
                keccak256(abi.encodePacked(_preimage)) == swap.hashlock,
                "Invalid preimage"
            );
            
            swap.withdrawn = true;
            payable(msg.sender).transfer(swap.amount);
            
            emit HTLCWithdraw(_contractId);
        }
        
        function refund(bytes32 _contractId) external {
            Swap storage swap = swaps[_contractId];
            require(swap.sender == msg.sender, "Only sender can refund");
            require(!swap.withdrawn, "Already withdrawn");
            require(!swap.refunded, "Already refunded");
            require(block.timestamp >= swap.locktime, "Locktime not reached");
            
            swap.refunded = true;
            payable(msg.sender).transfer(swap.amount);
            
            emit HTLCRefund(_contractId);
        }
        
        function getSwap(bytes32 _contractId) external view returns (Swap memory) {
            return swaps[_contractId];
        }
    }
  `;

  // Deploy contract
  const contract = await tronWeb.contract().new({
    abi: contractCode,
    bytecode: contractCode,
    feeLimit: 1000000000,
    callValue: 0,
    userFeePercentage: 100,
    originEnergyLimit: 1000000,
    parameters: [],
  });

  return contract.address;
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
3. **Anyone-can-claim**: On TRON side, anyone can claim TRX after timeout

### Resolver Incentives

- **Success Fee**: Resolver earns a percentage of the swap amount
- **Stake Return**: Successful resolvers get their stake back plus rewards
- **Reputation System**: Good resolvers get priority in future auctions

## Step 3: Fund the HTLC

Next, create and broadcast a transaction that sends TRX to the HTLC smart contract.

```typescript
async function fundHtlc(
  tronWeb: TronWeb,
  htlcAddress: string,
  amount: number
): Promise<string> {
  const tx = await tronWeb.trx.sendTransaction(
    htlcAddress,
    amount,
    process.env.TRON_PRIVATE_KEY
  );

  return tx.txid;
}
```

## Step 4: Monitor for the Secret

The resolver must monitor the TRON blockchain to detect when the user calls the withdraw function on the HTLC contract. When they do, their transaction will contain the secret (`preimage`) in the message body.

```typescript
// Monitor HTLC contract for withdrawals
async function watchForSecret(htlcAddress: string): Promise<string | null> {
  const contract = await tronWeb.contract().at(htlcAddress);

  // Get contract transactions
  const transactions = await tronWeb.trx.getTransactionsToAddress(
    htlcAddress,
    10
  );

  for (const tx of transactions) {
    if (tx.raw_data && tx.raw_data.contract) {
      for (const contract of tx.raw_data.contract) {
        if (contract.type === "TriggerSmartContract") {
          const parameter = contract.parameter.value;

          // Check if this is a withdraw call
          if (parameter.data && parameter.data.startsWith("0x")) {
            // Extract preimage from message data
            const data = parameter.data;
            if (data.length > 10) {
              // Has function selector + parameters
              const preimage = data.slice(10); // Remove function selector
              return preimage;
            }
          }
        }
      }
    }
  }

  return null;
}
```

Once the secret is extracted, the resolver can use it to complete the swap on the Ethereum side.

## Step 5: Handle Timelock Refunds

If the user never reveals the secret and the timelock expires, the resolver must reclaim its TRX.

```typescript
async function refundHtlc(
  tronWeb: TronWeb,
  htlcAddress: string,
  contractId: string
): Promise<string> {
  const contract = await tronWeb.contract().at(htlcAddress);

  // Check if timelock has expired
  const swap = await contract.getSwap(contractId).call();
  if (Date.now() / 1000 < swap.locktime) {
    throw new Error("Timelock has not expired yet");
  }

  // Call refund function
  const tx = await contract.refund(contractId).send({
    feeLimit: 1000000000,
    callValue: 0,
  });

  return tx;
}
```

## Step 6: Integration with Resolver Service

### Create TRON Integration Class

```typescript
export class TronIntegration {
  private tronWeb: TronWeb;
  private privateKey: string;

  constructor(privateKey: string, network: "mainnet" | "testnet" = "testnet") {
    this.privateKey = privateKey;
    this.tronWeb = new TronWeb({
      fullHost:
        network === "testnet"
          ? "https://nile.trongrid.io"
          : "https://api.trongrid.io",
      privateKey: privateKey,
    });
  }

  async createHtlc(
    recipientAddress: string,
    amount: number,
    hashlock: string,
    timelock: number
  ): Promise<string> {
    return await deployHtlcContract(
      this.tronWeb,
      recipientAddress,
      amount,
      hashlock,
      timelock
    );
  }

  async fundHtlc(htlcAddress: string, amount: number): Promise<string> {
    return await fundHtlc(this.tronWeb, htlcAddress, amount);
  }

  async watchForSecret(htlcAddress: string): Promise<string | null> {
    return await watchForSecret(htlcAddress);
  }

  async refundHtlc(htlcAddress: string, contractId: string): Promise<string> {
    return await refundHtlc(this.tronWeb, htlcAddress, contractId);
  }

  getAddress(): string {
    return this.tronWeb.address.fromPrivateKey(this.privateKey);
  }
}
```

### Add to Resolver Service

```typescript
import { TronIntegration } from "./tron-integration";

export class ResolverService {
  private tronIntegration: TronIntegration;

  constructor() {
    this.tronIntegration = new TronIntegration(process.env.TRON_PRIVATE_KEY!);
  }

  async initiateTronSwap(
    userAddress: string,
    amount: number,
    hashlock: string,
    timelock: number
  ): Promise<SwapResult> {
    // Create HTLC contract
    const htlcAddress = await this.tronIntegration.createHtlc(
      userAddress,
      amount,
      hashlock,
      timelock
    );

    // Fund the HTLC
    await this.tronIntegration.fundHtlc(htlcAddress, amount);

    return {
      htlcAddress,
      status: "funded",
    };
  }

  async monitorTronSwap(htlcAddress: string): Promise<string | null> {
    return await this.tronIntegration.watchForSecret(htlcAddress);
  }

  async refundTronSwap(
    htlcAddress: string,
    contractId: string
  ): Promise<string> {
    return await this.tronIntegration.refundHtlc(htlcAddress, contractId);
  }
}
```

## Step 7: Error Handling and Edge Cases

### Network-Specific Considerations

```typescript
// TRON-specific error handling
class TronError extends Error {
  constructor(message: string, public code: number) {
    super(message);
    this.name = "TronError";
  }
}

// Handle TRON network issues
async function handleTronError(error: any): Promise<void> {
  if (error.code === "NETWORK_ERROR") {
    // Retry with exponential backoff
    await retryWithBackoff(async () => {
      return await performTronOperation();
    });
  } else if (error.code === "INSUFFICIENT_BALANCE") {
    // Fund the wallet
    await fundWallet();
  } else {
    throw new TronError(error.message, error.code);
  }
}
```

### Energy Optimization

```typescript
// Optimize energy usage for TRON transactions
const energyEstimates = {
  deployHtlc: 1000000,
  fundHtlc: 100000,
  withdraw: 150000,
  refund: 120000,
};

async function estimateEnergy(operation: string): Promise<number> {
  return energyEstimates[operation] || 100000;
}
```

## Step 8: Testing and Validation

### Unit Tests

```typescript
describe("TRON Integration", () => {
  let tronIntegration: TronIntegration;

  beforeEach(() => {
    tronIntegration = new TronIntegration(testPrivateKey);
  });

  it("should create HTLC contract", async () => {
    const htlcAddress = await tronIntegration.createHtlc(
      testRecipient,
      testAmount,
      testHashlock,
      testTimelock
    );

    expect(htlcAddress).toMatch(/^T/);
  });

  it("should fund HTLC contract", async () => {
    const result = await tronIntegration.fundHtlc(testHtlcAddress, testAmount);
    expect(result).toBeTruthy();
  });

  it("should detect secret revelation", async () => {
    const secret = await tronIntegration.watchForSecret(testHtlcAddress);
    expect(secret).toBeTruthy();
  });
});
```

### Integration Tests

```typescript
describe("TRON-Ethereum Atomic Swap", () => {
  it("should complete ERC20 → TRX swap", async () => {
    // 1. User locks ERC20 tokens
    await lockErc20Tokens(userAddress, amount);

    // 2. Resolver creates and funds TRON HTLC
    const htlcAddress = await resolver.createTronHtlc(userAddress, amount);

    // 3. User reveals secret to claim TRX
    await user.claimTron(htlcAddress, secret);

    // 4. Resolver uses secret to claim ERC20
    await resolver.claimErc20(secret);

    // Verify balances
    expect(await getTronBalance(userAddress)).toBe(amount);
    expect(await getErc20Balance(resolverAddress)).toBe(amount);
  });
});
```

## Step 9: Production Deployment

### Environment Configuration

```env
# TRON Configuration
TRON_PRIVATE_KEY=your_tron_private_key_here
TRON_NETWORK=mainnet
TRON_RPC_URL=https://api.trongrid.io

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

class TronMonitor {
  private logger: Logger;

  constructor() {
    this.logger = new Logger("TRON_MONITOR");
  }

  async monitorSwaps(): Promise<void> {
    try {
      const activeSwaps = await this.getActiveSwaps();

      for (const swap of activeSwaps) {
        const secret = await this.tronIntegration.watchForSecret(
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

This guide provides a comprehensive approach to integrating TRON functionality into the Unite-DeFi resolver service. The key differences from Bitcoin integration are:

1. **Smart Contracts**: TRON uses smart contracts instead of Bitcoin scripts
2. **Address Format**: TRON uses T-prefixed addresses
3. **Energy Model**: TRON has a different energy model than Bitcoin
4. **Block Time**: TRON has ~3 second block time vs Bitcoin's ~10 minutes
5. **Development Tools**: TRON SDK vs Bitcoin.js

The integration enables true cross-chain atomic swaps between ERC20 tokens on Ethereum and native TRX, providing users with seamless cross-chain liquidity.

## Additional Resources

- [TRON Documentation](https://developers.tron.network/)
- [TRON SDK](https://github.com/tronprotocol/tronweb)
- [Solidity for TRON](https://developers.tron.network/docs/solidity)
- [1inch Fusion+ Documentation](https://docs.1inch.dev/)
