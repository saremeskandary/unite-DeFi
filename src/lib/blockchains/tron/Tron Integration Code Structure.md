# 1inch Fusion+ Tron Integration - Code Structure

## 📁 **Project Structure**

```
tron-fusion-integration/
├── contracts/                 # Smart contracts
├── src/
│   ├── core/                 # Core protocol logic
│   ├── tron/                 # Tron-specific implementations
│   ├── fusion/               # 1inch Fusion+ integration
│   ├── htlc/                 # Hash Time-Lock Contracts
│   ├── auction/              # Auction mechanism
│   ├── monitoring/           # Blockchain monitoring
│   ├── utils/                # Utility functions
│   └── types/                # TypeScript definitions
├── ui/                       # React frontend components
└── tests/                    # Test suites
```

## 🔧 **Core Modules**

### **1. Tron Integration (`src/tron/`)**
- **TronProvider**: Connection to Tron network (TronWeb/TronGrid)
- **TronHTLCManager**: Creates and manages Tron HTLC contracts
- **TronTransactionBuilder**: Builds TRX/TRC20 transactions
- **TronScriptHandler**: Handles Tron smart contract interactions
- **TronWalletConnector**: Wallet integration (TronLink, etc.)

### **2. Fusion+ Bridge (`src/fusion/`)**
- **FusionOrderBuilder**: Creates Fusion+ orders with Tron extensions
- **TronOrderExtension**: Tron-specific order parameters
- **CrossChainResolver**: Resolver logic for Tron swaps
- **AuctionManager**: Manages Dutch auction for Tron pairs
- **OrderValidator**: Validates Tron swap orders

### **3. HTLC Implementation (`src/htlc/`)**
- **TronHTLC**: Tron smart contract HTLC logic
- **EthereumHTLC**: Ethereum side HTLC (from Bitcoin version)
- **SecretManager**: Manages hash/secret pairs
- **TimeLockManager**: Handles timeout coordination
- **HTLCExecutor**: Executes atomic swap steps

### **4. Auction System (`src/auction/`)**
- **TronAuctionEngine**: Auction logic for TRX/TRC20 pairs
- **BidValidator**: Validates resolver bids
- **PriceOracle**: Gets TRX/TRC20 price feeds
- **ResolverStaking**: Manages resolver stakes and slashing

### **5. Monitoring (`src/monitoring/`)**
- **TronBlockMonitor**: Monitors Tron blockchain events
- **EventParser**: Parses Tron transaction events
- **SwapTracker**: Tracks swap progress across chains
- **NotificationService**: Real-time swap updates

## 💼 **Smart Contracts (`contracts/`)**

### **Tron Contracts (Solidity)**
- **TronHTLCContract.sol**: Main HTLC contract for Tron
- **TronResolverStaking.sol**: Resolver staking mechanism
- **TronOrderRegistry.sol**: Order tracking and validation
- **TronRefundHelper.sol**: Anyone-can-refund functionality

### **Ethereum Contracts**
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

## 🎨 **UI Components (`ui/`)**

### **Core Components**
- **TronWalletConnect**: TronLink wallet connection
- **TronSwapInterface**: Main swap interface
- **TronOrderHistory**: User's Tron swap history
- **TronLiquidityPools**: Available TRX/TRC20 pairs
- **TronTransactionStatus**: Real-time swap progress

### **Specialized Components**
- **TronAddressInput**: Tron address validation
- **TRC20TokenSelector**: TRC20 token picker
- **TronNetworkSelector**: Mainnet/Testnet switcher
- **TronGasEstimator**: Energy/bandwidth estimation

## 🔧 **Configuration & Utils**

### **Configuration (`src/config/`)**
- **TronNetworks**: Network configurations (mainnet/testnet)
- **ContractAddresses**: Deployed contract addresses
- **TronAPIs**: TronGrid/TronScan API endpoints
- **FusionConfig**: 1inch API integration settings

### **Utilities (`src/utils/`)**
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

## 🔌 **External Dependencies**

### **Tron Libraries**
- `tronweb`: Primary Tron blockchain interaction
- `tron-format`: Address and amount formatting
- `tron-crypto`: Cryptographic utilities

### **1inch Integration**
- `@1inch/fusion-sdk`: Core Fusion+ integration
- `@1inch/cross-chain-sdk`: Cross-chain utilities
- 1inch API endpoints for price feeds and order management

### **Shared Dependencies**
- `ethers.js`: Ethereum interactions
- `web3`: Alternative Ethereum provider
- `react`: Frontend framework
- `typescript`: Type safety

## 🚀 **Key Differences from Bitcoin Implementation**

1. **Smart Contracts**: Tron uses smart contracts vs Bitcoin scripts
2. **Account Model**: Tron uses accounts vs Bitcoin UTXOs  
3. **Energy System**: Tron energy/bandwidth vs Bitcoin fees
4. **TRC20 Support**: Native token standard support
5. **Faster Finality**: 3-second blocks vs 10-minute Bitcoin blocks

This structure provides a complete framework for integrating Tron with 1inch Fusion+ while maintaining the atomic swap security model and auction-based price discovery.