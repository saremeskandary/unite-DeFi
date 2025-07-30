## 🧪 Ethereum & 1inch Fusion+ Test Plan

This plan validates the on-chain logic, resolver interactions, and security of the Ethereum components that manage the escrow, settlement, and auction process for the atomic swaps.

### 1. Core Escrow Smart Contract Tests

This tests the fundamental `lock`, `claim`, and `refund` functions of your `BitcoinFusionEscrow` contract in isolation.

| ID          | Category               | Test Case                                                                                                       | Expected Outcome                                                                                          |
| :---------- | :--------------------- | :-------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------- |
| ETH-CORE-01 | **Locking Funds**      | A user calls the `lock` function with an ERC20 token, a `secretHash`, and a `lockTime`.                         | The contract successfully holds the user's tokens, and an event is emitted with the correct swap details. |
| ETH-CORE-02 | **Happy Path: Claim**  | The counterparty calls the `claim` function with the correct secret preimage **before** the `lockTime` expires. | The transaction succeeds, and the locked ERC20 tokens are transferred to the claimant.                    |
| ETH-CORE-03 | **Invalid Claim**      | The counterparty calls `claim` with an **incorrect** secret.                                                    | The transaction is reverted, and the funds remain locked in the contract.                                 |
| ETH-CORE-04 | **Happy Path: Refund** | The original depositor calls the `refund` function **after** the `lockTime` has expired.                        | The transaction succeeds, and the locked ERC20 tokens are returned to the depositor.                      |
| ETH-CORE-05 | **Invalid Refund**     | The original depositor calls `refund` **before** the `lockTime` has expired.                                    | The transaction is reverted, and the funds remain locked.                                                 |

---

### 2. Resolver & 1inch Auction Interaction

This section tests the resolver's ability to participate in the 1inch Fusion ecosystem and manage its stake.

| ID         | Category               | Test Case                                                                                                   | Expected Outcome                                                                                                 |
| :--------- | :--------------------- | :---------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------- |
| ETH-RES-01 | **Auction Monitoring** | A new Bitcoin swap order is created and appears in the 1inch WebSocket/API feed.                            | The resolver's off-chain service correctly identifies and parses the order details in real-time.                 |
| ETH-RES-02 | **Bidding Logic**      | The resolver's service determines the swap is profitable and submits a bid via the 1inch API.               | The bid is successfully accepted by the 1inch network and is visible in the auction.                             |
| ETH-RES-03 | **Staking**            | A new resolver attempts to participate by staking the required amount of ETH.                               | The stake is successfully registered in the `FusionBitcoinResolver` contract.                                    |
| ETH-RES-04 | **Slashing**           | Simulate a scenario where a resolver wins an auction but fails to execute the BTC-side of the swap in time. | The resolver's stake is correctly **slashed** as a penalty, and the order becomes available for other resolvers. |

---

### 3. End-to-End Swap Scenarios (Ethereum Perspective)

This tests the full workflow on Ethereum, ensuring seamless integration between the user, the resolver, and the contracts.

#### 🔄 **Scenario A: User Swaps ERC20 for Native BTC**

1.  **User Action:** Creates a Fusion order for 1 WBTC -> BTC.
2.  **Resolver Action:** Wins the 1inch auction.
3.  **Contract Interaction:** The user's 1 WBTC is automatically transferred and locked in the `BitcoinFusionEscrow` contract.
4.  **Cross-Chain Event:** The resolver obtains the secret from the completed Bitcoin-side transaction.
5.  **Resolver Action:** Calls `claim(secret)` on the `BitcoinFusionEscrow` contract.
6.  **✅ Expected Outcome:** The resolver successfully claims the 1 WBTC. The swap is complete on the Ethereum side.

#### 🔄 **Scenario B: User Swaps Native BTC for ERC20**

1.  **User Action:** Creates a Fusion order for BTC -> 1 WBTC.
2.  **Resolver Action:** Wins the 1inch auction and locks 1 WBTC in the `BitcoinFusionEscrow` contract. This transaction reveals the **secret** in its call data.
3.  **Cross-Chain Event:** The user's service detects the secret from the resolver's Ethereum transaction and uses it to claim the BTC on the Bitcoin chain.
4.  **Timeout Scenario:** Imagine the user's BTC-side client fails. After the timelock expires...
5.  **Resolver Action:** Calls `refund()` on the `BitcoinFusionEscrow` contract.
6.  **✅ Expected Outcome:** The resolver successfully reclaims their 1 WBTC. The system handles the user's failure gracefully.

---

### 4. Security & Edge Cases

This section focuses on ensuring the Ethereum-side logic is robust against attacks and unexpected situations.

| ID         | Category            | Test Case                                                                                           | Expected Outcome                                                                                                |
| :--------- | :------------------ | :-------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------- |
| ETH-SEC-01 | **Function Access** | An unauthorized address (not the claimant or original depositor) tries to call `claim` or `refund`. | The transaction is reverted due to failed authorization checks (`require` statements).                          |
| ETH-SEC-02 | **Secret Replay**   | A resolver tries to use a secret from a previous swap to claim funds from a new, unrelated swap.    | The claim fails because the `secretHash` in the contract's storage won't match the hash of the replayed secret. |
| ETH-SEC-03 | **Gas Exhaustion**  | A `claim` or `refund` transaction is sent with insufficient gas to complete.                        | The transaction fails, but the state of the contract remains unchanged (no funds are lost or stuck).            |
