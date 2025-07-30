## ✅ **Bitcoin-Side Testing Checklist**

### 🧱 1. HTLC Script Logic

- ✅ Hashlock: Validate SHA256 hash of the preimage (e.g., `OP_SHA256 <hash> OP_EQUAL`)
- ✅ Timelock: Correct `OP_CHECKLOCKTIMEVERIFY` placement
- ✅ Dual paths: Ensure both redemption path (with secret) and refund path (after timeout) work
- ✅ Compatible with P2SH **or** P2WSH depending on usage

---

### 🏗️ 2. Script Address Generation

- ✅ Generate and validate correct P2SH or P2WSH address from the script
- ✅ Match redeem script hash with address
- ✅ Compatible with different wallet formats (Legacy vs SegWit)

---

### 💰 3. Funding the HTLC

- ✅ Fund HTLC address on Bitcoin Testnet
- ✅ Verify broadcast and confirmation of UTXO
- ✅ Track funding transaction (txid, vout) for spend later

---

### 🔐 4. Redeeming with Preimage

- ✅ Build and sign Bitcoin transaction that:

  - Spends the HTLC using the secret + pubkey
  - Uses proper scriptSig/witness format

- ✅ Validate it gets accepted by nodes and mined
- ✅ Reveal the secret in a visible, parsable way

---

### 🔁 5. Refund Flow (Timelock Expiry)

- ✅ Confirm refund **only possible after** `nLockTime` block
- ✅ Refund transaction is correctly built and signed
- ✅ Verify timelock enforcement by testnet nodes
- ✅ Confirm refund UTXO appears in the sender’s wallet

---

### 👁️ 6. Secret Extraction Monitoring

- ✅ Monitor mempool and blockchain for HTLC redemption
- ✅ Extract secret (preimage) from input script or witness
- ✅ Trigger Ethereum-side swap completion using this secret

---

### 📦 7. UTXO Lifecycle & Fee Management

- ✅ Track and update wallet UTXOs (funding, spending)
- ✅ Proper fee estimation for redeem/refund
- ✅ Replace-by-Fee (RBF) support if refund gets stuck

---

### 🔒 8. Security & Edge Cases

- ✅ Reject redemption with wrong secret
- ✅ Prevent early refunds
- ✅ Reject double-spend attempts
- ✅ Test dust threshold (min BTC output)
- ✅ Confirm scripts are replay-safe and chain-specific (e.g., Testnet vs Mainnet)

---

### 🧪 9. Negative / Adversarial Testing (Advanced)

- ❌ Use malformed script (simulate dev error)
- ❌ Broadcast transaction with wrong sighash flag
- ❌ Attempt secret reuse across chains
- ❌ Use expired secret (too late for Ethereum claim)
- ❌ Simulate network latency between chains

---

## 🔧 Suggested Tools

| Tool                    | Purpose                              |
| ----------------------- | ------------------------------------ |
| `bitcoinjs-lib`         | Create HTLC scripts & transactions   |
| `bitcoind` or ElectrumX | Monitor and interact with Testnet    |
| `bcoin` or `btc-rpc`    | Programmatic UTXO and mempool access |
| `mocha` + `chai`        | Write automated test suite           |

---

# 🧪 Detailed Bitcoin-Side Testing Plan for Atomic Swaps

This plan ensures your Bitcoin integration is **secure**, **interoperable**, and **hackathon-grade**, supporting ETH ↔ BTC atomic swaps coordinated by 1inch Fusion+.

---

## 📁 TEST CATEGORIES

### 1. ✅ HTLC Script Logic Validation

**Objective**: Ensure the hashlock and timelock conditions are securely and correctly implemented.

**Tests**:

| ID          | Description                                               | Expected Outcome                                   |
| ----------- | --------------------------------------------------------- | -------------------------------------------------- |
| BTC-HTLC-01 | Generate script with secret hash and locktime             | Script OP codes match expected format              |
| BTC-HTLC-02 | Validate output script hash matches generated address     | Correct P2SH/P2WSH address                         |
| BTC-HTLC-03 | Script supports both redeem (secret) and refund (timeout) | Execution possible under correct conditions        |
| BTC-HTLC-04 | Compatibility with BIP199 / BIP65 if required             | Standardized timelock & cross-client compatibility |

**Script Logic Sample**:

```asm
OP_IF
  <receiverPubKey> OP_CHECKSIGVERIFY
  OP_SHA256 <secretHash> OP_EQUAL
OP_ELSE
  <locktime> OP_CHECKLOCKTIMEVERIFY OP_DROP
  <senderPubKey> OP_CHECKSIG
OP_ENDIF
```

---

### 2. 🏗️ Script Address Generation (P2SH or P2WSH)

**Objective**: Verify HTLC address is correctly derived and accepted by Bitcoin Testnet.

**Tests**:

| ID          | Description                    | Expected Outcome            |
| ----------- | ------------------------------ | --------------------------- |
| BTC-ADDR-01 | Generate script → hash160/P2SH | Valid base58 P2SH address   |
| BTC-ADDR-02 | Generate script → sha256/P2WSH | Valid bech32 P2WSH address  |
| BTC-ADDR-03 | Validate with testnet explorer | Address matches hash/script |

---

### 3. 💰 HTLC Funding Tests

**Objective**: Ensure that HTLC addresses can be safely and correctly funded.

**Tests**:

| ID          | Description                        | Expected Outcome                    |
| ----------- | ---------------------------------- | ----------------------------------- |
| BTC-FUND-01 | Send testnet BTC to HTLC address   | Transaction confirms                |
| BTC-FUND-02 | Validate resulting UTXO in mempool | UTXO visible, spendable later       |
| BTC-FUND-03 | Track txid/vout of UTXO            | Can be referenced for redeem/refund |

---

### 4. 🔐 HTLC Redemption with Preimage

**Objective**: Redeem locked BTC using the correct secret and public key.

**Tests**:

| ID            | Description                                | Expected Outcome                     |
| ------------- | ------------------------------------------ | ------------------------------------ |
| BTC-REDEEM-01 | Build valid redeem tx using correct secret | Redeem tx is accepted and mined      |
| BTC-REDEEM-02 | Validate that secret appears on chain      | Input script contains secret clearly |
| BTC-REDEEM-03 | Use redeem tx to extract preimage          | Ethereum side can use it             |

**Redeem Flow**:

- Spend the UTXO using proper input script
- Sign with receiver's private key
- Include preimage (secret)
- Broadcast and confirm

---

### 5. 🔁 HTLC Refund After Timeout

**Objective**: Allow safe refund of unclaimed HTLC after locktime expires.

**Tests**:

| ID            | Description                       | Expected Outcome           |
| ------------- | --------------------------------- | -------------------------- |
| BTC-REFUND-01 | Attempt refund before timeout     | Rejected by mempool/nodes  |
| BTC-REFUND-02 | Broadcast refund after timeout    | Accepted and confirmed     |
| BTC-REFUND-03 | Funds returned to original sender | Sender wallet receives BTC |

**Refund Flow**:

- Build transaction with `nLockTime = locktime`
- Wait for block height ≥ locktime
- Sign with sender's key
- Broadcast and confirm

---

### 6. 👁️ Secret Extraction for Ethereum Completion

**Objective**: Extract the secret (preimage) from Bitcoin chain to complete swap on Ethereum.

**Tests**:

| ID            | Description                                | Expected Outcome                       |
| ------------- | ------------------------------------------ | -------------------------------------- |
| BTC-SECRET-01 | Monitor mempool/blockchain for HTLC redeem | Detect secret in real time             |
| BTC-SECRET-02 | Parse secret from witness/scriptSig        | Extracts valid preimage                |
| BTC-SECRET-03 | Use secret to call `completeFusionSwap()`  | ETH-side completes using same preimage |

---

### 7. 📦 UTXO Lifecycle & Fee Management

**Objective**: Ensure safe UTXO tracking, fee estimation, and RBF support.

**Tests**:

| ID          | Description                        | Expected Outcome                           |
| ----------- | ---------------------------------- | ------------------------------------------ |
| BTC-UTXO-01 | Track UTXO creation and spending   | Balance updates correctly                  |
| BTC-UTXO-02 | Estimate fees before redeem/refund | Accurate fee → inclusion within 1–2 blocks |
| BTC-UTXO-03 | Enable RBF on refund tx            | Transaction can be replaced if stuck       |

**Tools**: `mempool.space`, `bitcoin-fee-estimator`, or custom Electrum script

---

### 8. 🔐 Security & Edge Cases

**Objective**: Catch failures, abuses, and unhandled conditions.

| ID         | Test Case                           | Expected Result                  |
| ---------- | ----------------------------------- | -------------------------------- |
| BTC-SEC-01 | Incorrect secret redemption attempt | Tx rejected by node              |
| BTC-SEC-02 | Early refund attempt                | Tx rejected (timelock violation) |
| BTC-SEC-03 | Script does not allow secret reuse  | Secret can't be used twice       |
| BTC-SEC-04 | Double-spend prevention             | Redeem+refund can't coexist      |
| BTC-SEC-05 | Dust-level UTXO input/output test   | Tx is rejected below threshold   |

---

## 🧪 Automation Tools

| Tool            | Use Case                             |
| --------------- | ------------------------------------ |
| `bitcoinjs-lib` | Build scripts, sign, broadcast txs   |
| `bitcoind` RPC  | Interact with mempool, blocks, UTXOs |
| `ElectrumX`     | Fast blockchain event monitoring     |
| `Mocha + Chai`  | Write repeatable automated tests     |

---

## ⚙️ Optional Advanced Tests

- ⏳ Simulate network delay between BTC & ETH finality
- 🔁 Use multiple HTLCs per order (partial fill handling)
- 🧮 Randomize redeem/refund timings to simulate user behavior
- 🪙 Test with mainnet-signing keys (watch-only) to validate prod-readiness

---

## ✅ Success Criteria

| Goal                       | Metric                          |
| -------------------------- | ------------------------------- |
| Reliable HTLC execution    | 100% of valid scripts spendable |
| Fault recovery             | Refunds succeed after timeout   |
| No stuck funds             | No UTXOs stranded irreversibly  |
| Secret cross-compatibility | ETH-side swap completes via BTC |

---

## 🧪 Comprehensive Test Plan for 1inch Fusion+ Bitcoin Atomic Swaps

This plan ensures your implementation is secure, resilient, and fully integrated, covering not just the Bitcoin HTLC mechanics but the entire swap lifecycle, including the resolver's role and potential failure modes.

### 1. Core Bitcoin HTLC Mechanics

This section refines and combines your previous tests for the fundamental Bitcoin-side operations.

| ID          | Category                 | Test Case                                                                                              | Expected Outcome                                                                              |
| :---------- | :----------------------- | :----------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------- |
| BTC-CORE-01 | **HTLC Script**          | Generate a P2SH/P2WSH script with a known secret hash and timelock.                                    | The generated script opcodes are correct and the derived address is valid on Bitcoin Testnet. |
| BTC-CORE-02 | **Funding**              | Send testnet BTC to the generated HTLC address.                                                        | The funding transaction confirms and the UTXO is visible and tied to the HTLC script.         |
| BTC-CORE-03 | **Happy Path: Redeem**   | Build and broadcast a transaction spending the HTLC UTXO using the correct secret preimage.            | The transaction is accepted and mined. The BTC is sent to the receiver's address.             |
| BTC-CORE-04 | **Unhappy Path: Refund** | Attempt to broadcast a refund transaction _before_ the timelock expires.                               | The transaction is rejected by Bitcoin nodes (`non-final`).                                   |
| BTC-CORE-05 | **Happy Path: Refund**   | Broadcast a refund transaction _after_ the timelock expires.                                           | The transaction is accepted and mined. The BTC is returned to the original funder.            |
| BTC-CORE-06 | **Monitoring**           | The resolver's monitoring service successfully parses the redeem transaction from the mempool/a block. | The correct secret preimage is extracted and passed to the Ethereum-side logic.               |

---

### 2. End-to-End Swap Scenarios (Crucial Addition)

This is the most important new section. It tests the **full, integrated workflow** from the user's perspective, ensuring all components (UI, 1inch API, Resolver, ETH Contracts, BTC Scripts) work together.

#### 🔄 **Scenario A: User Swaps ERC20 for Native BTC**

1.  **User Action:** User creates a Fusion order to swap 1 WBTC for native BTC.
2.  **Resolver Action:**
    - Wins the auction on the 1inch network.
    - Locks the corresponding amount of native BTC in an HTLC on Bitcoin Testnet.
3.  **User Action:**
    - The UI detects the BTC-side lock.
    - User's wallet/client reveals the secret to the Ethereum contract to claim the locked BTC (conceptually, by initiating the claim which releases the secret).
4.  **Resolver Action:**
    - Detects the secret revealed on the Ethereum chain.
    - Uses the secret to claim the user's WBTC from the Fusion contract.
5.  **✅ Expected Outcome:** The user receives native BTC, the resolver receives WBTC, and the swap is complete.

#### 🔄 **Scenario B: User Swaps Native BTC for ERC20**

1.  **User Action:** User creates a Fusion order and locks native BTC in an HTLC on Bitcoin Testnet. The `secretHash` is provided to the 1inch order.
2.  **Resolver Action:**
    - Wins the auction.
    - Detects the funded HTLC on the Bitcoin chain.
    - Fills the Fusion order, sending the corresponding ERC20 to the user's Ethereum address. This action **reveals the secret** on the Ethereum chain.
3.  **User Action:**
    - Detects the secret from the resolver's transaction on Ethereum.
    - Uses the secret to redeem the locked native BTC on the Bitcoin chain.
4.  **✅ Expected Outcome:** The user receives ERC20 and redeems their original BTC. The resolver has successfully facilitated the swap.

---

### 3. Resolver Logic & Resilience Testing (New Section)

This tests the "brain" of your resolver to ensure it's profitable, fast, and robust.

| ID           | Category             | Test Case                                                                               | Expected Outcome                                                                                                  |
| :----------- | :------------------- | :-------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------- |
| RES-LOGIC-01 | **Profitability**    | Simulate an auction with high Bitcoin network fees.                                     | The resolver should calculate a negative profit and **not** bid on the order.                                     |
| RES-LOGIC-02 | **Auction Bidding**  | A new, attractive order appears in the 1inch WebSocket feed.                            | The resolver correctly analyzes the order and submits a competitive bid within seconds.                           |
| RES-FAIL-01  | **BTC Node Failure** | The resolver's primary Bitcoin node connection drops while waiting for an HTLC to fund. | The resolver seamlessly fails over to a backup node (e.g., a public block explorer API) and continues monitoring. |
| RES-FAIL-02  | **Stuck TX**         | A Bitcoin redeem/refund transaction is broadcast with a fee that is too low.            | The resolver correctly uses Replace-by-Fee (RBF) to bump the fee and ensure the transaction is mined.             |

---

### 4. Security & Adversarial Testing (Expanded)

This section expands on edge cases to ensure the system is secure against malicious actors or critical errors.

| ID         | Category             | Test Case                                                                                                                               | Expected Outcome                                                                                                                  |
| :--------- | :------------------- | :-------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------- |
| SEC-ADV-01 | **Invalid Secret**   | A malicious user tries to redeem the BTC HTLC with an incorrect secret.                                                                 | The Bitcoin transaction is invalid and rejected.                                                                                  |
| SEC-ADV-02 | **Secret Re-use**    | A resolver tries to use an old secret from a previous swap to claim funds.                                                              | The `secretHash` won't match the current swap's hash, so the claim will fail on both chains.                                      |
| SEC-ADV-03 | **Refund Race**      | The user fails to redeem in time. As soon as the timelock expires, both the user (redeem) and resolver (refund) broadcast transactions. | Only the valid transaction (the refund) should be confirmed. The system must handle the race condition gracefully.                |
| SEC-ADV-04 | **ETH-Side Failure** | The resolver's `completeFusionSwap` call on Ethereum fails (e.g., runs out of gas).                                                     | The resolver should have a retry mechanism. The user's funds on the BTC side remain safe and become refundable after the timeout. |
