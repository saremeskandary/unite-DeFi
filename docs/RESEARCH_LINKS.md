# Research Links for 1inch Fusion+ Bitcoin Swap

This document contains a collection of useful links for research and development purposes.

## 1. 1inch Protocol & SDK Documentation

- **[1inch Developer Portal](https://portal.1inch.dev/documentation/overview)**: The main entry point for all 1inch API and SDK documentation. **(Primary Resource)**
- **[1inch Fusion SDK (GitHub)](https://github.com/1inch/fusion-sdk)**: The official SDK for interacting with the 1inch Fusion mode. Essential for creating and managing orders.
- **[1inch Fusion SDK (NPM)](https://www.npmjs.com/package/@1inch/fusion-sdk)**: The package manager link for the Fusion SDK.
- **[1inch Cross-Chain SDK (GitHub)](https://github.com/1inch/cross-chain-sdk)**: The official SDK for cross-chain interactions.
- **[1inch Cross-Chain SDK (NPM)](https://www.npmjs.com/package/@1inch/cross-chain-sdk)**: The package manager link for the Cross-Chain SDK.

## 2. Example Implementations & Code

- **[1inch Fusion Resolver Example (GitHub)](https://github.com/1inch/fusion-resolver-example)**: An official example of a 1inch Fusion resolver. This is a critical resource for building our off-chain component.
- **[1inch Go SDK (GitHub)](https://github.com/1inch/1inch-sdk-go)**: While we are using TypeScript, this can provide additional insight into how the 1inch API is structured and used.

## 3. Bitcoin & HTLC Resources

- **[Bitcoin Developer Documentation](https://bitcoin.org/en/developer-documentation)**: The official Bitcoin developer documentation, including information on transactions, scripting, and HTLCs.
- **[bitcoinjs-lib (GitHub)](https://github.com/bitcoinjs/bitcoinjs-lib)**: The JavaScript library we will use for creating Bitcoin transactions and HTLC scripts.

## 4. Hackathon Information

- **[Unite DeFi Hackathon Prizes](https://ethglobal.com/events/unite/prizes)**: The official prize page for the hackathon, detailing the requirements for the 1inch prize.

## 5. Technical Deep Dive

- **[1inch Fusion+ Whitepaper](https://1inch.io/assets/1inch-fusion-plus.pdf?utm_source=chatgpt.com)**: The official whitepaper explaining the architecture and security model of the Fusion+ cross-chain solution. This is a critical read.
- **[ETHGlobal Workshop Video](https://www.youtube.com/watch?v=DKQJlzJuTqQ)**: Introduction to 1inch Fusion+ at the Unite DeFi hackathon.

Here’s your **RESEARCH_LINKS.md** file, outlining the key technical resources and detailed breakdowns for **1inch Fusion** and **Fusion+** protocols:

---

## 🧪 1inch Fusion (Single‑chain Intent‑based Dutch Auction Swap)

- **What is 1inch “Fusion”, and how does it work?**
  Official Help article describing Fusion’s architecture: intent-based limit orders, resolver Dutch auctions, MEV protection, zero user gas costs, partial fills, and resolver staking/gas caps ([1inch Help Center][1]).

- **A deep dive into 1inch Fusion**
  Blog post explaining blending of aggregation + LOP, Dutch auction presets, resolver competition, liquidity sourcing, MEV resistance, and UX presets (fast/fair/custom) ([1inch Blog][2]).

## 🌉 1inch Fusion+ (Cross‑chain Atomic Swap Architecture)

- **1inch introduces Fusion+: a new standard for cross‑chain swaps**
  Blog by 1inch introducing Fusion+, explaining its intent‑based model, atomic swap escrow structure (HTLC design), Dutch auction-based pricing, user self‑custody model, and risk mitigation via recovery phase ([1inch Blog][3], [1inch Network][4]).

- **What is 1inch Fusion+, and how does it work?**
  Help article breaking Fusion+ swap phases: Announcement, Deposit, Withdrawal, optional Recovery phase; escrow security with hashlock/timelock, safety deposits, resolver incentives ([1inch Help Center][5]).

- **Fusion+ live: effortless cross‑chain trading for all**
  Medium post summarizing Fusion+ UX in 1inch dApp and Wallet, atomic swap automation, user flow and tab stay requirements for trustless verification (Link removed - not found).

- **Limit Order Protocol, Fusion & Fusion+ – MixBytes technical breakdown**
  In‑depth review by MixBytes: LOP base-order structure, extension data, Dutch auction logic, Fusion upgrades, Fusion+ atomic‑swap HTLC implementation, Merkle‑tree secret architecture, resolver incentives, and recovery logic ([MixBytes][7]).

- **1INCH FUSION+ (Whitepaper PDF)**
  Official Fusion+ specification: atomic swap HTLC fundamentals, Merkle‑tree secret handling, protocol-wide safeguards, cross‑chain escrow contract design and security rationale ([1inch Network][4]).

## 🎯 Additional Context & Coverage

- **1inch to fix cross‑chain swaps with the full release of Fusion+**
  Blockworks news article summarizing Fusion+ benefits: eliminating bridges, trustless design, auction-based pricing, MEV protection, and atomic swap security model ([Blockworks][8]).

---

## 🧎 Summary Table

| Area                  | Key Insights Covered                                                                                                                                                                                |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Limit Order Protocol  | Maker/taker order structure, extensions, programmable logic, salt-based extensions, off-chain signatures ([MixBytes][7])                                                                            |
| Fusion (single chain) | Resolver Dutch auction, no-user-gas flow, MEV resistance, resolver staking, gas caps logic ([1inch Help Center][1], [1inch Blog][2])                                                                |
| Fusion+ (cross-chain) | Atomic swap logic, HTLC escrows on both chains, secret‑hash linkage, timelocks, recovery fallback, multi‑fill via Merkle tree secrets ([1inch Blog][3], [1inch Network][4], [1inch Help Center][5]) |
| UX & Developer Tools  | dApp/Wallet flows, order interface, API speeds, resolver onboarding process, cross-chain support ([1inch Developer Portal][9], [OKX][10])                                              |

---

## 🚀 How to Use These Resources

1. **Read the Fusion+ whitepaper** to understand cross-chain escrow design, Merkle-tree secret architecture, and recovery logic.
2. **Review MixBytes article** for architectural context: how LOP forms the foundation, how Dutch auctions and cross-chain logic extend it.
3. **Explore official Help Center articles** (Fusion and Fusion+) for protocol flow, resolver mechanics, presets, and guided phases.
4. **Study the blog posts** (1inch and Blockworks) for high-level design rationale, security measures, and UX guidelines.
5. **Use Developer Portal & API docs** on Fusion+ to connect code-level order creation, quote fetching, and secret submission flows ([1inch Developer Portal][9], [MixBytes][7], [1inch Blog][3]).

[1]: https://help.1inch.io/en/articles/6796085-what-is-1inch-fusion-and-how-does-it-work?utm_source=chatgpt.com "What is 1inch \"Fusion\", and how does it work?"
[2]: https://blog.1inch.io/a-deep-dive-into-1inch-fusion/?utm_source=chatgpt.com "A deep dive into 1inch Fusion - Blog"
[3]: https://blog.1inch.io/1inch-introduces-fusion-plus/?utm_source=chatgpt.com "1inch introduces Fusion+: a new standard for cross-chain swaps - Blog"
[4]: https://1inch.io/assets/1inch-fusion-plus.pdf?utm_source=chatgpt.com "[PDF] 1INCH FUSION+"
[5]: https://help.1inch.io/en/articles/9842591-what-is-1inch-fusion-and-how-does-it-work?utm_source=chatgpt.com "What is 1inch Fusion+, and how does it work?"
[6]: # "Fusion+ live: effortless cross-chain trading for all | by 1inch - Medium (Link removed - not found)"
[7]: https://mixbytes.io/blog/modern-dex-es-how-they-re-made-1inch-limit-order-protocols?utm_source=chatgpt.com "1inch Limit Order Protocol, Fusion & Fusion+ - MixBytes"
[8]: https://blockworks.co/news/1inch-fixing-cross-chain-swaps?utm_source=chatgpt.com "1inch to fix cross-chain swaps with the full release of Fusion+"
[9]: https://portal.1inch.dev/documentation/overview "1inch Developer Portal - Fusion+ Documentation"
[10]: https://www.okx.com/fr-fr/learn/1inch-solana-integration-defi-fusion-protocol?utm_source=chatgpt.com "1inch Integrates Solana: Revolutionizing DeFi with Fusion Protocol ..."
