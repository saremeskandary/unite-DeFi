# 1inch Fusion+ Tron Integration - Code Structure

## 📁 **Project Structure**

```
unite-DeFi/
├── contracts/                 # Smart contracts
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
│   │   ├── tron-swap/        # Tron swap interface pages
│   │   ├── tron-wallet/      # Tron wallet connection pages
│   │   └── layout.tsx        # Root layout with providers
│   ├── components/           # React components
│   │   ├── ui/              # shadcn/ui components
│   │   ├── tron/            # Tron-specific components
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

### **1. Tron Integration (`src/lib/blockchains/tron/`)**

- **TronProvider**: Connection to Tron network (TronWeb/TronGrid)
- **TronHTLCManager**: Creates and manages Tron HTLC contracts
- **TronTransactionBuilder**: Builds TRX/TRC20 transactions
- **TronScriptHandler**: Handles Tron smart contract interactions
- **TronWalletConnector**: Wallet integration (TronLink, etc.)

### **2. Fusion+ Bridge (`src/lib/fusion/`)**

- **FusionOrderBuilder**: Creates Fusion+ orders with Tron extensions
- **TronOrderExtension**: Tron-specific order parameters
- **CrossChainResolver**: Resolver logic for Tron swaps
- **AuctionManager**: Manages Dutch auction for Tron pairs
- **OrderValidator**: Validates Tron swap orders

### **3. HTLC Implementation (`src/lib/htlc/`)**

- **TronHTLC**: Tron smart contract HTLC logic
- **EthereumHTLC**: Ethereum side HTLC (from Bitcoin version)
- **SecretManager**: Manages hash/secret pairs
- **TimeLockManager**: Handles timeout coordination
- **HTLCExecutor**: Executes atomic swap steps

### **4. Auction System (`src/lib/auction/`)**

- **TronAuctionEngine**: Auction logic for TRX/TRC20 pairs
- **BidValidator**: Validates resolver bids
- **PriceOracle**: Gets TRX/TRC20 price feeds
- **ResolverStaking**: Manages resolver stakes and slashing

### **5. Monitoring (`src/lib/monitoring/`)**

- **TronBlockMonitor**: Monitors Tron blockchain events
- **EventParser**: Parses Tron transaction events
- **SwapTracker**: Tracks swap progress across chains
- **NotificationService**: Real-time swap updates

## 💼 **Smart Contracts (`contracts/`)**

### **Tron Contracts (Solidity) - `contracts/tron/`**

- **TronHTLCContract.sol**: Main HTLC contract for Tron
- **TronResolverStaking.sol**: Resolver staking mechanism
- **TronOrderRegistry.sol**: Order tracking and validation
- **TronRefundHelper.sol**: Anyone-can-refund functionality

### **Ethereum Contracts - `contracts/ethereum/`**

- **TronBridgeExtension.sol**: Extends Fusion+ for Tron support
- **TronOrderValidator.sol**: Validates Tron order parameters
- **CrossChainEscrow.sol**: Holds ERC20 tokens during swaps

## 🔄 **Swap Flow Implementation**

### **ERC20 → TRX/TRC20 Flow**

1. **Order Creation**: `FusionOrderBuilder` + `TronOrderExtension`
2. **Auction**: `TronAuctionEngine` manages resolver competition
3. **HTLC Deployment**: `TronHTLCManager` deploys Tron contract
4. **Monitoring**: `TronBlockMonitor` watches for user claim
5. **Completion**: `HTLCExecutor` completes Ethereum side

### **TRX/TRC20 → ERC20 Flow**

1. **HTLC Creation**: User locks TRX/TRC20 in Tron contract
2. **Auction**: Resolvers bid on Ethereum side
3. **Escrow**: Winner locks ERC20 in Ethereum escrow
4. **Execution**: Resolver claims TRX/TRC20, user claims ERC20

## 🎨 **Next.js UI Components (`src/components/`)**

### **Tron-Specific Components (`src/components/tron/`)**

- **TronWalletConnect**: TronLink wallet connection with shadcn/ui
- **TronSwapInterface**: Main swap interface using shadcn/ui components
- **TronOrderHistory**: User's Tron swap history with data tables
- **TronLiquidityPools**: Available TRX/TRC20 pairs with cards
- **TronTransactionStatus**: Real-time swap progress with progress bars

### **Specialized Components**

- **TronAddressInput**: Tron address validation with form validation
- **TRC20TokenSelector**: TRC20 token picker with combobox
- **TronNetworkSelector**: Mainnet/Testnet switcher with toggle
- **TronGasEstimator**: Energy/bandwidth estimation with sliders

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

- **TronNetworks**: Network configurations (mainnet/testnet)
- **ContractAddresses**: Deployed contract addresses
- **TronAPIs**: TronGrid/TronScan API endpoints
- **FusionConfig**: 1inch API integration settings

### **Utilities (`src/lib/utils/`)**

- **TronAddressUtils**: Address validation and conversion
- **TronAmountUtils**: TRX/SUN conversion utilities
- **TronTransactionUtils**: Transaction building helpers
- **TronCryptoUtils**: Signature and hash utilities

## 🧪 **Testing Structure (`tests/`)**

### **Unit Tests**

- **tron.test.ts**: Tron integration tests
- **htlc.test.ts**: HTLC functionality tests
- **auction.test.ts**: Auction mechanism tests
- **fusion.test.ts**: Fusion+ integration tests

### **Integration Tests**

- **e2e-swap.test.ts**: End-to-end swap testing
- **cross-chain.test.ts**: Cross-chain communication tests
- **resolver.test.ts**: Resolver workflow tests

### **Component Tests**

- **TronSwapInterface.test.tsx**: Component testing with React Testing Library
- **TronWalletConnect.test.tsx**: Wallet integration testing
- **TronAddressInput.test.tsx**: Form validation testing

## 🔌 **External Dependencies**

### **Tron Libraries**

- `tronweb`: Primary Tron blockchain interaction
- `tron-format`: Address and amount formatting
- `tron-crypto`: Cryptographic utilities

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
- `web3`: Alternative Ethereum provider
- `typescript`: Type safety

## 🚀 **Key Differences from Bitcoin Implementation**

1. **Smart Contracts**: Tron uses smart contracts vs Bitcoin scripts
2. **Account Model**: Tron uses accounts vs Bitcoin UTXOs
3. **Energy System**: Tron energy/bandwidth vs Bitcoin fees
4. **TRC20 Support**: Native token standard support
5. **Faster Finality**: 3-second blocks vs 10-minute Bitcoin blocks

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

This structure provides a complete framework for integrating Tron with 1inch Fusion+ while maintaining the atomic swap security model and auction-based price discovery, all built with modern Next.js and shadcn/ui components.
