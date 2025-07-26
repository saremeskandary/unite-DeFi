# Project Blueprint: 1inch Fusion+ for Bitcoin Cross-Chain Swaps

## 1. Project Overview

This project aims to win the 1inch prize at the Unite DeFi Hackathon by extending the **1inch Fusion+ protocol** to support atomic swaps between Ethereum (or EVM chains) and Bitcoin.

The core of the project is to build a system that allows a user to create a swap intent on the Ethereum side, which is then fulfilled by a `resolver` who facilitates the corresponding transaction on the Bitcoin network using a Hashed Time-Lock Contract (HTLC). This implementation will rely heavily on the **1inch APIs and SDKs** to be eligible for the prize.

## 2. Core Requirements (Hackathon Mandates)

- **Preserve Hashlock/Timelock:** Implement a secure HTLC mechanism for both chains.
- **Bidirectional Swaps:** The system must support swaps from ETH to BTC and from BTC to ETH.
- **On-Chain Execution:** The final demo must show successful token transfers on a testnet or mainnet.
- **Extensive API/SDK Use:** The project must integrate with the `@1inch/fusion-sdk` and `@1inch/cross-chain-sdk`.

## 3. System Architecture

The project will be divided into three main components: On-Chain Contracts (Solidity), an Off-Chain Resolver Service (TypeScript/Node.js), and a simple Frontend UI (Stretch Goal).

### 3.1. On-Chain Components (Solidity on Ethereum)

These contracts manage the Ethereum side of the swap.

1.  **`BitcoinFusionEscrow.sol`**:
    *   An escrow contract that holds the user's ERC20 tokens.
    *   It's controlled by a hashlock and timelock.
    *   **`initiateSwap`**: Called by the resolver to lock the user's funds.
    *   **`completeSwap`**: Called by the resolver after the Bitcoin-side of the swap is confirmed. It requires the secret `preimage` and transfers the ERC20 tokens to the resolver.
    *   **`refundSwap`**: Called by the user (maker) if the timelock expires, returning their funds.

2.  **`FusionOrderExtension.sol`**:
    *   A data contract to augment standard 1inch Fusion orders with Bitcoin-specific details.
    *   Stores a struct `BitcoinSwapExtension` containing:
        *   `btcAddress`: The destination Bitcoin address.
        *   `btcAmount`: The amount of BTC to be received.
        *   `hashlock`: The hash of the secret.

### 3.2. Off-Chain Components (TypeScript/Node.js)

This is the core backend service that acts as the **Resolver**. It connects the 1inch ecosystem with the Bitcoin network.

1.  **1inch API/SDK Integration (`@1inch/fusion-sdk`, `@1inch/cross-chain-sdk`)**:
    *   Listen for new Fusion orders with the custom Bitcoin extension.
    *   Submit bids for these orders in the 1inch Dutch auction.
    *   Monitor the status of submitted orders via the 1inch API.

2.  **Swap Execution Logic**:
    *   Once an order is won, the resolver initiates the swap:
        1.  Calls `initiateSwap` on the `BitcoinFusionEscrow` contract to lock the user's ERC20 tokens.
        2.  Constructs a Bitcoin HTLC transaction using `bitcoinjs-lib`. The script will contain the same hashlock and a shorter timelock.
        3.  Broadcasts the HTLC transaction to the Bitcoin network.

3.  **Swap Completion & Monitoring**:
    *   The service monitors both chains.
    *   When the user reveals the secret to claim the BTC, the resolver detects this.
    *   It then uses the revealed secret (`preimage`) to call `completeSwap` on the Ethereum escrow contract to claim the ERC20 tokens.

### 3.3. Frontend UI (Stretch Goal)

A simple web interface to facilitate user interaction.

*   **Connect Wallet**: Connect a user's Ethereum wallet (e.g., MetaMask).
*   **Create Swap Intent**: A form where the user can:
    *   Select the ERC20 token and amount to swap.
    *   Enter their destination Bitcoin address.
    *   The UI generates a secret, calculates the hash, and uses the **1inch Fusion SDK** to create and sign the Fusion order.
*   **Track Swap Status**: Display the real-time status of the swap by querying the 1inch API and our resolver service.

## 4. Technology Stack

*   **Blockchain (On-Chain)**: Solidity, Hardhat/Foundry
*   **Backend (Off-Chain Resolver)**: Node.js, TypeScript, Ethers.js, `bitcoinjs-lib`, `axios`
*   **1inch SDKs**: `@1inch/fusion-sdk`, `@1inch/cross-chain-sdk`
*   **Frontend (UI)**: React/Next.js, Ethers.js

## 5. Implementation Steps

1.  **Setup**: Initialize a monorepo with packages for `contracts`, `resolver`, and `frontend`.
2.  **Contracts**:
    *   Write and test the `BitcoinFusionEscrow` and `FusionOrderExtension` contracts.
    *   Deploy them to an Ethereum testnet (e.g., Sepolia).
3.  **Resolver Service**:
    *   Set up the Node.js/TypeScript project.
    *   Integrate the 1inch SDKs and configure API keys.
    *   Implement the logic to listen for and bid on orders.
    *   Write the Bitcoin HTLC script generation logic using `bitcoinjs-lib`.
    *   Implement the full swap execution flow (lock, broadcast, monitor, claim).
4.  **Frontend**:
    *   Build the UI for creating and tracking swaps.
    *   Integrate the Fusion SDK for order creation and signing.
5.  **End-to-End Testing**:
    *   Perform a full swap on testnets (e.g., Sepolia <-> Bitcoin Testnet).
    *   Test the refund logic by letting the timelock expire.
    *   Ensure bidirectionality can be demonstrated.
