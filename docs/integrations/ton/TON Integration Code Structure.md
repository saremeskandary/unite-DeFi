# 1inch Fusion+ TON Integration - Code Structure

## 📁 **Project Structure**

```
unite-DeFi/
├── contracts/                 # Smart contracts (FunC)
│   ├── ethereum/             # Ethereum contracts (existing)
│   │   ├── BitcoinFusionEscrow.sol
│   │   ├── FusionOrderExtension.sol
│   │   └── ...
│   ├── tron/                 # TRON contracts (Solidity)
│   │   ├── TronHTLCContract.sol
│   │   ├── TronResolverStaking.sol
│   │   ├── TronOrderRegistry.sol
│   │   └── TronRefundHelper.sol
│   └── ton/                  # TON contracts (FunC)
│       ├── ton_htlc.fc
│       ├── jetton_htlc.fc
│       ├── resolver_staking.fc
│       ├── order_registry.fc
│       ├── refund_helper.fc
│       └── message_router.fc
├── src/
│   ├── app/                  # Next.js App Router pages
│   │   ├── ton-swap/         # TON swap interface pages
│   │   ├── ton-wallet/       # TON wallet connection pages
│   │   └── layout.tsx        # Root layout with providers
│   ├── components/           # React components
│   │   ├── ui/              # shadcn/ui components
│   │   ├── ton/             # TON-specific components
│   │   └── shared/          # Shared components
│   ├── lib/                 # Core utilities and integrations
│   │   ├── blockchains/     # Blockchain integrations
│   │   │   ├── bitcoin/     # Bitcoin integration (scripts only)
│   │   │   ├── tron/        # TRON integration (TypeScript + contracts)
│   │   │   └── ton/         # TON integration (TypeScript + contracts)
│   │   ├── fusion/          # 1inch Fusion+ integration
│   │   ├── htlc/            # Hash Time-Lock Contracts
│   │   ├── auction/         # Auction mechanism
│   │   ├── monitoring/      # Blockchain monitoring
│   │   └── utils/           # Utility functions
│   ├── hooks/               # Custom React hooks
│   ├── types/               # TypeScript definitions
│   └── styles/              # Global styles and Tailwind
├── public/                  # Static assets
├── tests/                   # Test files
├── hardhat.config.ts        # Hardhat config for Ethereum/TRON
├── ton.config.ts           # TON compiler config
└── package.json             # pnpm dependencies
```

## 🔧 **Core Modules**

### **1. TON Integration (`src/lib/blockchains/ton/`)**

- **TonProvider**: Connection to TON network (TonConnect/TON API)
- **TonHTLCManager**: Creates and manages TON HTLC contracts
- **TonTransactionBuilder**: Builds TON/Jetton transactions
- **TonCellBuilder**: Handles TON Cell and BOC structures
- **TonWalletConnector**: Wallet integration (Tonkeeper, TonHub, etc.)
- **TonAddressManager**: Handles workchain address formats

### **2. Fusion+ Bridge (`src/lib/fusion/`)**

- **FusionOrderBuilder**: Creates Fusion+ orders with TON extensions
- **TonOrderExtension**: TON-specific order parameters
- **CrossChainResolver**: Resolver logic for TON swaps
- **AuctionManager**: Manages Dutch auction for TON/Jetton pairs
- **OrderValidator**: Validates TON swap orders

### **3. HTLC Implementation (`src/lib/htlc/`)**

- **TonHTLC**: TON smart contract HTLC logic (FunC)
- **EthereumHTLC**: Ethereum side HTLC (from Bitcoin version)
- **SecretManager**: Manages hash/secret pairs
- **TimeLockManager**: Handles timeout coordination
- **HTLCExecutor**: Executes atomic swap steps
- **MessageBuilder**: Builds TON internal messages

### **4. Auction System (`src/lib/auction/`)**

- **TonAuctionEngine**: Auction logic for TON/Jetton pairs
- **BidValidator**: Validates resolver bids
- **PriceOracle**: Gets TON/Jetton price feeds
- **ResolverStaking**: Manages resolver stakes and slashing
- **JettonPairManager**: Handles Jetton token pairs

### **5. Monitoring (`src/lib/monitoring/`)**

- **TonBlockMonitor**: Monitors TON blockchain events
- **TransactionParser**: Parses TON transaction structures
- **SwapTracker**: Tracks swap progress across chains
- **NotificationService**: Real-time swap updates
- **ShardMonitor**: Monitors multiple TON shards

## 💼 **Smart Contracts (`contracts/`)**

### **TON Contracts (FunC) - `contracts/ton/`**

- **ton_htlc.fc**: Main HTLC contract for TON
- **jetton_htlc.fc**: Jetton-specific HTLC variant
- **resolver_staking.fc**: Resolver staking mechanism
- **order_registry.fc**: Order tracking and validation
- **refund_helper.fc**: Anyone-can-refund functionality
- **message_router.fc**: Routes cross-contract messages

### **Ethereum Contracts - `contracts/ethereum/`**

- **TonBridgeExtension.sol**: Extends Fusion+ for TON support
- **TonOrderValidator.sol**: Validates TON order parameters
- **CrossChainEscrow.sol**: Holds ERC20 tokens during swaps

## 🔄 **Swap Flow Implementation**

### **ERC20 → TON/Jetton Flow**

1. **Order Creation**: `FusionOrderBuilder` + `TonOrderExtension`
2. **Auction**: `TonAuctionEngine` manages resolver competition
3. **HTLC Deployment**: `TonHTLCManager` deploys TON contract
4. **Message Handling**: `MessageBuilder` creates internal messages
5. **Monitoring**: `TonBlockMonitor` watches for user claim
6. **Completion**: `HTLCExecutor` completes Ethereum side

### **TON/Jetton → ERC20 Flow**

1. **HTLC Creation**: User locks TON/Jettons in TON contract
2. **Auction**: Resolvers bid on Ethereum side
3. **Escrow**: Winner locks ERC20 in Ethereum escrow
4. **Execution**: Resolver claims TON/Jettons, user claims ERC20

## 🎨 **Next.js UI Components (`src/components/`)**

### **TON-Specific Components (`src/components/ton/`)**

- **TonWalletConnect**: TonConnect wallet integration with shadcn/ui
- **TonSwapInterface**: Main swap interface using shadcn/ui components
- **TonOrderHistory**: User's TON swap history with data tables
- **TonLiquidityPools**: Available TON/Jetton pairs with cards
- **TonTransactionStatus**: Real-time swap progress with progress bars

### **Specialized Components**

- **TonAddressInput**: TON address validation (workchain format) with form validation
- **JettonTokenSelector**: Jetton token picker with combobox
- **TonNetworkSelector**: Mainnet/Testnet switcher with toggle
- **TonGasEstimator**: Gas fee estimation with sliders
- **ShardSelector**: Workchain/shard selection with select dropdown

### **shadcn/ui Integration**

- **Button**: Primary, secondary, and variant buttons for actions
- **Card**: Information display and layout containers
- **Dialog**: Modal dialogs for confirmations and forms
- **Form**: Form handling with react-hook-form and zod validation
- **Input**: Text inputs with validation states
- **Select**: Dropdown selections for tokens and networks
- **Progress**: Progress indicators for swap status
- **Toast**: Notification system for user feedback
- **Table**: Data tables for order history and pools
- **Tabs**: Tabbed interfaces for different swap modes

## 🔧 **Configuration & Utils**

### **Configuration (`src/lib/config/`)**

- **TonNetworks**: Network configurations (mainnet/testnet)
- **ContractAddresses**: Deployed contract addresses per shard
- **TonAPIs**: TON API endpoints and configurations
- **FusionConfig**: 1inch API integration settings
- **WorkchainConfig**: Workchain and shard configurations

### **Utilities (`src/lib/utils/`)**

- **TonAddressUtils**: Address validation and workchain handling
- **TonAmountUtils**: TON/nanoTON conversion utilities
- **TonCellUtils**: Cell serialization/deserialization
- **TonCryptoUtils**: Signature and hash utilities
- **BOCUtils**: Bag of Cells manipulation
- **MessageUtils**: Internal message construction

## 🧪 **Testing Structure (`tests/`)**

### **Unit Tests**

- **ton.test.ts**: TON integration tests
- **htlc.test.ts**: HTLC functionality tests
- **auction.test.ts**: Auction mechanism tests
- **fusion.test.ts**: Fusion+ integration tests
- **cell.test.ts**: Cell structure tests

### **Integration Tests**

- **e2e-swap.test.ts**: End-to-end swap testing
- **cross-chain.test.ts**: Cross-chain communication tests
- **resolver.test.ts**: Resolver workflow tests
- **shard.test.ts**: Multi-shard transaction tests

### **Component Tests**

- **TonSwapInterface.test.tsx**: Component testing with React Testing Library
- **TonWalletConnect.test.tsx**: Wallet integration testing
- **TonAddressInput.test.tsx**: Form validation testing

## 🔌 **External Dependencies**

### **TON Libraries**

- `@ton/core`: Core TON blockchain primitives
- `@ton/ton`: TON network interaction
- `@ton/crypto`: Cryptographic utilities
- `@ton/contracts`: Contract interaction helpers
- `ton-connect`: Wallet connection standard

### **1inch Integration**

- `@1inch/fusion-sdk`: Core Fusion+ integration
- `@1inch/cross-chain-sdk`: Cross-chain utilities
- 1inch API endpoints for price feeds and order management

### **Next.js & UI Dependencies**

- `next`: React framework with App Router
- `react`: Frontend framework
- `react-dom`: React DOM rendering
- `@radix-ui/*`: Headless UI primitives for shadcn/ui
- `tailwindcss`: Utility-first CSS framework
- `lucide-react`: Icon library
- `class-variance-authority`: Component variant management
- `clsx`: Conditional className utility
- `tailwind-merge`: Tailwind class merging

### **Form & Validation**

- `react-hook-form`: Form state management
- `@hookform/resolvers`: Form validation resolvers
- `zod`: TypeScript-first schema validation

### **Shared Dependencies**

- `ethers.js`: Ethereum interactions
- `typescript`: Type safety
- `buffer`: Buffer handling for TON cells

## 🚀 **Key TON-Specific Features**

### **1. Architecture Differences**

- **Actor Model**: Each contract is an independent actor
- **Asynchronous Messages**: All communication via internal messages
- **Sharding**: Automatic workchain/shard distribution
- **Gas Model**: Separate computation and storage fees

### **2. Data Structures**

- **Cells**: Primary data structure (max 1023 bits, 4 refs)
- **BOC**: Bag of Cells for serialization
- **Addresses**: Workchain:account format
- **Messages**: Internal/external message types

### **3. Contract Features**

- **FunC Language**: Stack-based smart contract language
- **TL-B Schemas**: Type-Length-Binary serialization
- **Jetton Standard**: TON's fungible token standard
- **NFT Support**: Built-in NFT capabilities

### **4. Wallet Integration**

- **TonConnect**: Universal wallet connection protocol
- **Multiple Wallets**: Tonkeeper, TonHub, OpenMask support
- **QR Codes**: Mobile wallet connection via QR
- **Deep Links**: Direct wallet app integration

## 🔐 **Security Considerations**

### **TON-Specific Security**

- **Message Validation**: Strict internal message validation
- **Replay Protection**: Sequence number management
- **Gas Limits**: Prevent infinite loops in contracts
- **Shard Safety**: Cross-shard transaction atomicity

### **HTLC Security**

- **Hash Preimage**: SHA-256 secret commitment
- **Timelock Safety**: Proper timeout coordination
- **Refund Mechanism**: Anyone-can-refund after timeout
- **Resolver Bonding**: Economic security via staking

## 🌊 **TON Advantages for DeFi**

1. **High Throughput**: Millions of TPS via sharding
2. **Low Fees**: Efficient gas model and parallel processing
3. **Fast Finality**: ~5 second block times
4. **Scalability**: Automatic sharding as demand grows
5. **Mobile First**: Excellent mobile wallet ecosystem
6. **Telegram Integration**: Native Telegram ecosystem support

## 📦 **Package Management**

### **pnpm Configuration**

- **Lockfile**: `pnpm-lock.yaml` for deterministic installs
- **Workspace**: Monorepo support for multiple packages
- **Scripts**: Development, build, and test commands
- **Dependencies**: Optimized dependency resolution

### **Development Workflow**

- `pnpm dev`: Start Next.js development server
- `pnpm build`: Build production application
- `pnpm test`: Run Jest test suite
- `pnpm lint`: ESLint code quality checks
- `pnpm typecheck`: TypeScript type checking

### **Build Tools**

- **Hardhat**: For Ethereum/TRON contract compilation and deployment
- **TON Compiler**: For TON FunC contract compilation
- **TypeScript**: For application code compilation
- **Next.js**: For frontend build and optimization

This structure leverages TON's unique architecture while maintaining atomic swap security and integrating seamlessly with 1inch Fusion+ for optimal cross-chain liquidity, all built with modern Next.js and shadcn/ui components.
