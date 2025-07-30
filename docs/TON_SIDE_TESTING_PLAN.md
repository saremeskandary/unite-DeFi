## ✅ **TON-Side Testing Checklist**

### 🧱 1. HTLC Smart Contract Logic

- ✅ Hashlock: Validate SHA256 hash of the preimage in TON smart contract
- ✅ Timelock: Correct `now` timestamp validation in contract
- ✅ Dual paths: Ensure both redemption path (with secret) and refund path (after timeout) work
- ✅ Compatible with TON wallet formats (v3R2, v4R2)

---

### 🏗️ 2. Smart Contract Deployment

- ✅ Deploy and validate HTLC smart contract on TON Testnet
- ✅ Match contract address with wallet address format
- ✅ Compatible with different wallet versions (v3R2 vs v4R2)

---

### 💰 3. Funding the HTLC

- ✅ Fund HTLC contract on TON Testnet
- ✅ Verify broadcast and confirmation of transaction
- ✅ Track funding transaction (lt, hash) for spend later

---

### 🔐 4. Redeeming with Preimage

- ✅ Build and sign TON transaction that:

  - Calls the HTLC contract with the secret + recipient address
  - Uses proper message format and gas limits

- ✅ Validate it gets accepted by validators and confirmed
- ✅ Reveal the secret in a visible, parsable way

---

### 🔁 5. Refund Flow (Timelock Expiry)

- ✅ Confirm refund **only possible after** `now` timestamp
- ✅ Refund transaction is correctly built and signed
- ✅ Verify timelock enforcement by TON validators
- ✅ Confirm refund TON appears in the sender's wallet

---

### 👁️ 6. Secret Extraction Monitoring

- ✅ Monitor mempool and blockchain for HTLC redemption
- ✅ Extract secret (preimage) from transaction message
- ✅ Trigger Ethereum-side swap completion using this secret

---

### 📦 7. TON Lifecycle & Fee Management

- ✅ Track and update wallet balances (funding, spending)
- ✅ Proper gas estimation for redeem/refund
- ✅ Replace-by-Fee (RBF) support if refund gets stuck

---

### 🔒 8. Security & Edge Cases

- ✅ Reject redemption with wrong secret
- ✅ Prevent early refunds
- ✅ Reject double-spend attempts
- ✅ Test dust threshold (min TON amount)
- ✅ Confirm contracts are replay-safe and chain-specific (e.g., Testnet vs Mainnet)

---

### 🧪 9. Negative / Adversarial Testing (Advanced)

- ❌ Use malformed contract (simulate dev error)
- ❌ Broadcast transaction with wrong gas limit
- ❌ Attempt secret reuse across chains
- ❌ Use expired secret (too late for Ethereum claim)
- ❌ Simulate network latency between chains

---

## 🔧 Suggested Tools

| Tool             | Purpose                           |
| ---------------- | --------------------------------- |
| `ton`            | TON SDK for contract interactions |
| `ton-core`       | Core TON functionality            |
| `ton-crypto`     | Cryptographic operations          |
| `mocha` + `chai` | Write automated test suite        |

---

# 🧪 Detailed TON-Side Testing Plan for Atomic Swaps

This plan ensures your TON integration is **secure**, **interoperable**, and **hackathon-grade**, supporting ETH ↔ TON atomic swaps coordinated by 1inch Fusion+.

---

## 📁 TEST CATEGORIES

### 1. ✅ HTLC Smart Contract Logic Validation

**Objective**: Ensure the hashlock and timelock conditions are securely and correctly implemented in TON smart contracts.

**Tests**:

| ID          | Description                                                 | Expected Outcome                                   |
| ----------- | ----------------------------------------------------------- | -------------------------------------------------- |
| TON-HTLC-01 | Deploy HTLC contract with secret hash and locktime          | Contract deploys successfully with correct logic   |
| TON-HTLC-02 | Validate contract address matches TON address format        | Correct TON address format (EQ...)                 |
| TON-HTLC-03 | Contract supports both redeem (secret) and refund (timeout) | Execution possible under correct conditions        |
| TON-HTLC-04 | Compatibility with TON standards (TEP-74, etc.)             | Standardized contract & cross-client compatibility |

**Contract Logic Sample**:

```func
;; HTLC Smart Contract for TON
;; TEP-74 compliant

;; Storage
;; - hash: uint256 (secret hash)
;; - recipient: address (recipient address)
;; - sender: address (sender address)
;; - locktime: uint64 (unlock timestamp)
;; - balance: uint128 (locked amount)

;; Message handlers
;; - redeem(secret: uint256) - redeem with secret
;; - refund() - refund after timeout
```

---

### 2. 🏗️ Smart Contract Deployment (v3R2/v4R2)

**Objective**: Verify HTLC contract is correctly deployed and accepted by TON Testnet.

**Tests**:

| ID          | Description                    | Expected Outcome            |
| ----------- | ------------------------------ | --------------------------- |
| TON-ADDR-01 | Deploy contract → get address  | Valid TON address (EQ...)   |
| TON-ADDR-02 | Validate with testnet explorer | Address matches contract    |
| TON-ADDR-03 | Check contract code on-chain   | Code matches deployed logic |

---

### 3. 💰 HTLC Funding Tests

**Objective**: Ensure that HTLC contracts can be safely and correctly funded.

**Tests**:

| ID          | Description                            | Expected Outcome                    |
| ----------- | -------------------------------------- | ----------------------------------- |
| TON-FUND-01 | Send testnet TON to HTLC contract      | Transaction confirms                |
| TON-FUND-02 | Validate resulting balance in contract | Balance visible, spendable later    |
| TON-FUND-03 | Track tx hash/lt of transaction        | Can be referenced for redeem/refund |

---

### 4. 🔐 HTLC Redemption with Preimage

**Objective**: Redeem locked TON using the correct secret and recipient address.

**Tests**:

| ID            | Description                                | Expected Outcome                    |
| ------------- | ------------------------------------------ | ----------------------------------- |
| TON-REDEEM-01 | Build valid redeem tx using correct secret | Redeem tx is accepted and confirmed |
| TON-REDEEM-02 | Validate that secret appears on chain      | Transaction contains secret clearly |
| TON-REDEEM-03 | Use redeem tx to extract preimage          | Ethereum side can use it            |

**Redeem Flow**:

- Call contract with proper message format
- Include preimage (secret) in message
- Specify recipient address
- Broadcast and confirm

---

### 5. 🔁 HTLC Refund After Timeout

**Objective**: Allow safe refund of unclaimed HTLC after locktime expires.

**Tests**:

| ID            | Description                       | Expected Outcome           |
| ------------- | --------------------------------- | -------------------------- |
| TON-REFUND-01 | Attempt refund before timeout     | Rejected by validators     |
| TON-REFUND-02 | Broadcast refund after timeout    | Accepted and confirmed     |
| TON-REFUND-03 | Funds returned to original sender | Sender wallet receives TON |

**Refund Flow**:

- Build transaction with current timestamp ≥ locktime
- Wait for timestamp to pass
- Call refund function
- Broadcast and confirm

---

### 6. 👁️ Secret Extraction for Ethereum Completion

**Objective**: Extract the secret (preimage) from TON chain to complete swap on Ethereum.

**Tests**:

| ID            | Description                                | Expected Outcome                       |
| ------------- | ------------------------------------------ | -------------------------------------- |
| TON-SECRET-01 | Monitor mempool/blockchain for HTLC redeem | Detect secret in real time             |
| TON-SECRET-02 | Parse secret from transaction message      | Extracts valid preimage                |
| TON-SECRET-03 | Use secret to call `completeFusionSwap()`  | ETH-side completes using same preimage |

---

### 7. 📦 TON Lifecycle & Fee Management

**Objective**: Ensure safe balance tracking, gas estimation, and transaction management.

**Tests**:

| ID          | Description                         | Expected Outcome                           |
| ----------- | ----------------------------------- | ------------------------------------------ |
| TON-UTXO-01 | Track balance creation and spending | Balance updates correctly                  |
| TON-UTXO-02 | Estimate gas before redeem/refund   | Accurate gas → inclusion within 1–2 blocks |
| TON-UTXO-03 | Enable RBF on refund tx             | Transaction can be replaced if stuck       |

**Tools**: `ton.org`, `toncenter.com`, or custom TON API script

---

### 8. 🔐 Security & Edge Cases

**Objective**: Catch failures, abuses, and unhandled conditions.

| ID         | Test Case                            | Expected Result                  |
| ---------- | ------------------------------------ | -------------------------------- |
| TON-SEC-01 | Incorrect secret redemption attempt  | Tx rejected by validators        |
| TON-SEC-02 | Early refund attempt                 | Tx rejected (timelock violation) |
| TON-SEC-03 | Contract does not allow secret reuse | Secret can't be used twice       |
| TON-SEC-04 | Double-spend prevention              | Redeem+refund can't coexist      |
| TON-SEC-05 | Dust-level TON input/output test     | Tx is rejected below threshold   |

---

## 🧪 Automation Tools

| Tool            | Use Case                              |
| --------------- | ------------------------------------- |
| `ton`           | Deploy contracts, sign, broadcast txs |
| `ton-core`      | Core TON functionality                |
| `toncenter.com` | Fast blockchain event monitoring      |
| `Mocha + Chai`  | Write repeatable automated tests      |

---

## ⚙️ Optional Advanced Tests

- ⏳ Simulate network delay between TON & ETH finality
- 🔁 Use multiple HTLCs per order (partial fill handling)
- 🧮 Randomize redeem/refund timings to simulate user behavior
- 🪙 Test with mainnet-signing keys (watch-only) to validate prod-readiness

---

## ✅ Success Criteria

| Goal                       | Metric                            |
| -------------------------- | --------------------------------- |
| Reliable HTLC execution    | 100% of valid contracts spendable |
| Fault recovery             | Refunds succeed after timeout     |
| No stuck funds             | No balances stranded irreversibly |
| Secret cross-compatibility | ETH-side swap completes via TON   |

---

## 🧪 Comprehensive Test Plan for 1inch Fusion+ TON Atomic Swaps

This plan ensures your implementation is secure, resilient, and fully integrated, covering not just the TON HTLC mechanics but the entire swap lifecycle, including the resolver's role and potential failure modes.

### 1. Core TON HTLC Mechanics

This section refines and combines your previous tests for the fundamental TON-side operations.

| ID          | Category                 | Test Case                                                                                              | Expected Outcome                                                                           |
| :---------- | :----------------------- | :----------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------- |
| TON-CORE-01 | **HTLC Contract**        | Deploy a smart contract with a known secret hash and timelock.                                         | The deployed contract logic is correct and the address is valid on TON Testnet.            |
| TON-CORE-02 | **Funding**              | Send testnet TON to the deployed HTLC contract.                                                        | The funding transaction confirms and the balance is visible and tied to the HTLC contract. |
| TON-CORE-03 | **Happy Path: Redeem**   | Build and broadcast a transaction calling the HTLC contract using the correct secret preimage.         | The transaction is accepted and confirmed. The TON is sent to the receiver's address.      |
| TON-CORE-04 | **Unhappy Path: Refund** | Attempt to broadcast a refund transaction _before_ the timelock expires.                               | The transaction is rejected by TON validators (`invalid timestamp`).                       |
| TON-CORE-05 | **Happy Path: Refund**   | Broadcast a refund transaction _after_ the timelock expires.                                           | The transaction is accepted and confirmed. The TON is returned to the original funder.     |
| TON-CORE-06 | **Monitoring**           | The resolver's monitoring service successfully parses the redeem transaction from the mempool/a block. | The correct secret preimage is extracted and passed to the Ethereum-side logic.            |

---

### 2. End-to-End Swap Scenarios (Crucial Addition)

This is the most important new section. It tests the **full, integrated workflow** from the user's perspective, ensuring all components (UI, 1inch API, Resolver, ETH Contracts, TON Contracts) work together.

#### 🔄 **Scenario A: User Swaps ERC20 for Native TON**

1.  **User Action:** User creates a Fusion order to swap 1 WBTC for native TON.
2.  **Resolver Action:**
    - Wins the auction on the 1inch network.
    - Locks the corresponding amount of native TON in an HTLC contract on TON Testnet.
3.  **User Action:**
    - The UI detects the TON-side lock.
    - User's wallet/client reveals the secret to the Ethereum contract to claim the locked TON (conceptually, by initiating the claim which releases the secret).
4.  **Resolver Action:**
    - Detects the secret revealed on the Ethereum chain.
    - Uses the secret to claim the user's WBTC from the Fusion contract.
5.  **✅ Expected Outcome:** The user receives native TON, the resolver receives WBTC, and the swap is complete.

#### 🔄 **Scenario B: User Swaps Native TON for ERC20**

1.  **User Action:** User creates a Fusion order and locks native TON in an HTLC contract on TON Testnet. The `secretHash` is provided to the 1inch order.
2.  **Resolver Action:**
    - Wins the auction.
    - Detects the funded HTLC on the TON chain.
    - Fills the Fusion order, sending the corresponding ERC20 to the user's Ethereum address. This action **reveals the secret** on the Ethereum chain.
3.  **User Action:**
    - Detects the secret from the resolver's transaction on Ethereum.
    - Uses the secret to redeem the locked native TON on the TON chain.
4.  **✅ Expected Outcome:** The user receives ERC20 and redeems their original TON. The resolver has successfully facilitated the swap.

---

### 3. Resolver Logic & Resilience Testing (New Section)

This tests the "brain" of your resolver to ensure it's profitable, fast, and robust.

| ID           | Category             | Test Case                                                                           | Expected Outcome                                                                                       |
| :----------- | :------------------- | :---------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------- |
| RES-LOGIC-01 | **Profitability**    | Simulate an auction with high TON network fees.                                     | The resolver should calculate a negative profit and **not** bid on the order.                          |
| RES-LOGIC-02 | **Auction Bidding**  | A new, attractive order appears in the 1inch WebSocket feed.                        | The resolver correctly analyzes the order and submits a competitive bid within seconds.                |
| RES-FAIL-01  | **TON Node Failure** | The resolver's primary TON node connection drops while waiting for an HTLC to fund. | The resolver seamlessly fails over to a backup node (e.g., a public TON API) and continues monitoring. |
| RES-FAIL-02  | **Stuck TX**         | A TON redeem/refund transaction is broadcast with a gas limit that is too low.      | The resolver correctly uses gas bumping to ensure the transaction is mined.                            |

---

### 4. Security & Adversarial Testing (Expanded)

This section expands on edge cases to ensure the system is secure against malicious actors or critical errors.

| ID         | Category             | Test Case                                                                                                                               | Expected Outcome                                                                                                                  |
| :--------- | :------------------- | :-------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------- |
| SEC-ADV-01 | **Invalid Secret**   | A malicious user tries to redeem the TON HTLC with an incorrect secret.                                                                 | The TON transaction is invalid and rejected.                                                                                      |
| SEC-ADV-02 | **Secret Re-use**    | A resolver tries to use an old secret from a previous swap to claim funds.                                                              | The `secretHash` won't match the current swap's hash, so the claim will fail on both chains.                                      |
| SEC-ADV-03 | **Refund Race**      | The user fails to redeem in time. As soon as the timelock expires, both the user (redeem) and resolver (refund) broadcast transactions. | Only the valid transaction (the refund) should be confirmed. The system must handle the race condition gracefully.                |
| SEC-ADV-04 | **ETH-Side Failure** | The resolver's `completeFusionSwap` call on Ethereum fails (e.g., runs out of gas).                                                     | The resolver should have a retry mechanism. The user's funds on the TON side remain safe and become refundable after the timeout. |

---

## 🧪 TON-Specific Considerations

### Smart Contract Standards

- **TEP-74**: Standard for smart contract interfaces
- **TEP-89**: Standard for wallet contracts
- **TEP-95**: Standard for Jetton (fungible tokens)

### Gas Optimization

- TON uses a different gas model than Ethereum
- Gas costs are typically lower on TON
- Consider gas optimization for frequent operations

### Network Characteristics

- **Block Time**: ~5 seconds (vs Bitcoin's ~10 minutes)
- **Finality**: ~2-3 blocks (vs Bitcoin's 6+ blocks)
- **Transaction Format**: Different from Bitcoin/Ethereum

### Wallet Integration

- **v3R2**: Legacy wallet format
- **v4R2**: Modern wallet format with better features
- **Highload**: For high-frequency operations

---

## 🔧 TON Development Tools

| Tool            | Purpose                  |
| --------------- | ------------------------ |
| `ton`           | Main TON SDK             |
| `ton-core`      | Core TON functionality   |
| `ton-crypto`    | Cryptographic operations |
| `ton-compiler`  | FunC compiler            |
| `tonos-cli`     | Command-line interface   |
| `toncenter.com` | Public API for TON       |

---

## 📚 Additional Resources

- [TON Documentation](https://docs.ton.org/)
- [TON Smart Contracts](https://docs.ton.org/develop/smart-contracts/)
- [FunC Language](https://docs.ton.org/develop/func/)
- [TON Testnet](https://t.me/testgiver_ton_bot)
- [1inch Fusion+ Documentation](https://docs.1inch.dev/)
