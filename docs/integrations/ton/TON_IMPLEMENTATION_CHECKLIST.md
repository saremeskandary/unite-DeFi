# TON Integration Implementation Checklist

## 📋 **Overview**
This checklist outlines the implementation requirements for each file in the TON integration structure. Follow this guide to systematically implement the TON blockchain integration with 1inch Fusion+.

## 🏗️ **Smart Contracts (`contracts/ton/`)**

### **1. `ton_htlc.fc` - TON HTLC Contract**
- [ ] **Contract Structure**
  - [ ] Define contract storage layout (balance, hashlock, timelock, sender, recipient)
  - [ ] Implement constructor for contract initialization
  - [ ] Add getter methods for contract state

- [ ] **Core HTLC Functions**
  - [ ] `create_htlc()` - Create new HTLC with hashlock and timelock
  - [ ] `claim_htlc()` - Claim funds with preimage (secret)
  - [ ] `refund_htlc()` - Refund after timeout
  - [ ] `extend_timelock()` - Extend timeout period

- [ ] **Security Features**
  - [ ] Hash validation (SHA-256)
  - [ ] Timelock validation
  - [ ] Access control (only sender can refund)
  - [ ] Reentrancy protection

- [ ] **Message Handling**
  - [ ] Internal message processing
  - [ ] External message validation
  - [ ] Error handling and gas management

### **2. `jetton_htlc.fc` - Jetton HTLC Contract**
- [ ] **Jetton Integration**
  - [ ] Import Jetton standard interfaces
  - [ ] Handle Jetton transfer messages
  - [ ] Manage Jetton balances

- [ ] **HTLC Functions**
  - [ ] `create_jetton_htlc()` - Create HTLC with Jetton tokens
  - [ ] `claim_jetton_htlc()` - Claim Jetton with preimage
  - [ ] `refund_jetton_htlc()` - Refund Jetton after timeout

- [ ] **Jetton-Specific Features**
  - [ ] Jetton amount validation
  - [ ] Jetton owner verification
  - [ ] Jetton transfer execution

### **3. `resolver_staking.fc` - Resolver Staking Contract**
- [ ] **Staking Mechanism**
  - [ ] Stake deposit function
  - [ ] Stake withdrawal function
  - [ ] Stake slashing for misbehavior

- [ ] **Resolver Management**
  - [ ] Resolver registration
  - [ ] Resolver reputation tracking
  - [ ] Minimum stake requirements

- [ ] **Economic Security**
  - [ ] Slashing conditions
  - [ ] Reward distribution
  - [ ] Stake lock periods

### **4. `order_registry.fc` - Order Registry Contract**
- [ ] **Order Management**
  - [ ] Order registration
  - [ ] Order validation
  - [ ] Order status tracking

- [ ] **Registry Functions**
  - [ ] `register_order()` - Register new swap order
  - [ ] `update_order_status()` - Update order state
  - [ ] `get_order()` - Retrieve order details

- [ ] **Order Validation**
  - [ ] Parameter validation
  - [ ] Balance checks
  - [ ] Timestamp validation

### **5. `refund_helper.fc` - Refund Helper Contract**
- [ ] **Anyone-Can-Refund**
  - [ ] `refund_expired_htlc()` - Allow anyone to refund expired HTLCs
  - [ ] Gas compensation for refunders
  - [ ] Refund verification

- [ ] **Safety Features**
  - [ ] Expiration validation
  - [ ] Refund amount calculation
  - [ ] Event emission

### **6. `message_router.fc` - Message Router Contract**
- [ ] **Message Routing**
  - [ ] Route messages between contracts
  - [ ] Message validation
  - [ ] Error handling

- [ ] **Cross-Contract Communication**
  - [ ] HTLC to Registry communication
  - [ ] Registry to Staking communication
  - [ ] Message format standardization

## 🔧 **Core Integration Modules (`src/lib/blockchains/ton/`)**

### **1. `TonProvider.ts` - TON Network Connection**
- [ ] **Network Configuration**
  - [ ] Mainnet/Testnet endpoints
  - [ ] API client initialization
  - [ ] Network switching

- [ ] **Connection Management**
  - [ ] Connection status monitoring
  - [ ] Reconnection logic
  - [ ] Error handling

- [ ] **API Integration**
  - [ ] TON API client setup
  - [ ] Rate limiting
  - [ ] Response caching

### **2. `TonHTLCManager.ts` - HTLC Contract Management**
- [ ] **Contract Deployment**
  - [ ] HTLC contract deployment
  - [ ] Contract address management
  - [ ] Deployment verification

- [ ] **HTLC Operations**
  - [ ] Create HTLC transactions
  - [ ] Claim HTLC transactions
  - [ ] Refund HTLC transactions

- [ ] **State Management**
  - [ ] HTLC state tracking
  - [ ] Event monitoring
  - [ ] Status updates

### **3. `TonTransactionBuilder.ts` - Transaction Building**
- [ ] **Transaction Construction**
  - [ ] Build TON transactions
  - [ ] Build Jetton transactions
  - [ ] Gas estimation

- [ ] **Message Building**
  - [ ] Internal message construction
  - [ ] External message construction
  - [ ] Message signing

- [ ] **Transaction Validation**
  - [ ] Transaction format validation
  - [ ] Balance checks
  - [ ] Gas limit validation

### **4. `TonCellBuilder.ts` - Cell and BOC Handling**
- [ ] **Cell Operations**
  - [ ] Cell creation and manipulation
  - [ ] Cell serialization/deserialization
  - [ ] Cell validation

- [ ] **BOC Handling**
  - [ ] Bag of Cells creation
  - [ ] BOC serialization
  - [ ] BOC parsing

- [ ] **Data Structures**
  - [ ] Complex data structure handling
  - [ ] Nested cell management
  - [ ] Memory optimization

### **5. `TonWalletConnector.ts` - Wallet Integration**
- [ ] **TonConnect Integration**
  - [ ] TonConnect client setup
  - [ ] Wallet connection
  - [ ] Connection state management

- [ ] **Wallet Support**
  - [ ] Tonkeeper integration
  - [ ] TonHub integration
  - [ ] OpenMask integration

- [ ] **User Experience**
  - [ ] QR code generation
  - [ ] Deep link handling
  - [ ] Connection status UI

### **6. `TonAddressManager.ts` - Address Management**
- [ ] **Address Validation**
  - [ ] TON address format validation
  - [ ] Workchain validation
  - [ ] Checksum verification

- [ ] **Address Conversion**
  - [ ] Raw to user-friendly conversion
  - [ ] User-friendly to raw conversion
  - [ ] Cross-workchain conversion

- [ ] **Address Utilities**
  - [ ] Address generation
  - [ ] Address comparison
  - [ ] Address formatting

## 🎨 **UI Components (`src/components/ton/`)**

### **1. `TonWalletConnect.tsx` - Wallet Connection Component**
- [ ] **Component Structure**
  - [ ] React component with TypeScript
  - [ ] shadcn/ui integration
  - [ ] Responsive design

- [ ] **Wallet Connection**
  - [ ] Connect/disconnect buttons
  - [ ] Connection status display
  - [ ] Wallet selection modal

- [ ] **User Experience**
  - [ ] Loading states
  - [ ] Error handling
  - [ ] Success notifications

### **2. `TonSwapInterface.tsx` - Main Swap Interface**
- [ ] **Swap Form**
  - [ ] Token selection (TON/Jetton)
  - [ ] Amount input with validation
  - [ ] Recipient address input

- [ ] **Swap Information**
  - [ ] Price display
  - [ ] Gas fee estimation
  - [ ] Transaction preview

- [ ] **Swap Actions**
  - [ ] Execute swap button
  - [ ] Transaction status tracking
  - [ ] Success/error handling

### **3. `TonOrderHistory.tsx` - Order History Component**
- [ ] **Data Display**
  - [ ] Order list with pagination
  - [ ] Order status indicators
  - [ ] Transaction details

- [ ] **Filtering and Sorting**
  - [ ] Status-based filtering
  - [ ] Date range filtering
  - [ ] Sort by amount/date

- [ ] **Data Management**
  - [ ] Real-time updates
  - [ ] Data caching
  - [ ] Export functionality

### **4. `TonLiquidityPools.tsx` - Liquidity Pools Component**
- [ ] **Pool Display**
  - [ ] Available pools list
  - [ ] Pool statistics
  - [ ] Pool health indicators

- [ ] **Pool Information**
  - [ ] Token pairs
  - [ ] Liquidity amounts
  - [ ] Volume statistics

- [ ] **Pool Actions**
  - [ ] Add liquidity
  - [ ] Remove liquidity
  - [ ] Pool navigation

### **5. `TonTransactionStatus.tsx` - Transaction Status Component**
- [ ] **Status Tracking**
  - [ ] Real-time status updates
  - [ ] Progress indicators
  - [ ] Status messages

- [ ] **Transaction Details**
  - [ ] Transaction hash display
  - [ ] Block confirmation count
  - [ ] Gas usage information

- [ ] **User Feedback**
  - [ ] Success notifications
  - [ ] Error messages
  - [ ] Retry options

### **6. `TonAddressInput.tsx` - Address Input Component**
- [ ] **Input Validation**
  - [ ] Real-time address validation
  - [ ] Format checking
  - [ ] Error messages

- [ ] **User Experience**
  - [ ] Auto-completion
  - [ ] Address book integration
  - [ ] QR code scanning

- [ ] **Form Integration**
  - [ ] React Hook Form integration
  - [ ] Zod validation
  - [ ] Error state handling

### **7. `JettonTokenSelector.tsx` - Jetton Token Selector**
- [ ] **Token List**
  - [ ] Available Jettons display
  - [ ] Token search functionality
  - [ ] Token filtering

- [ ] **Token Information**
  - [ ] Token metadata display
  - [ ] Balance information
  - [ ] Price information

- [ ] **Selection Interface**
  - [ ] Token selection modal
  - [ ] Recent tokens
  - [ ] Favorite tokens

### **8. `TonNetworkSelector.tsx` - Network Selector**
- [ ] **Network Options**
  - [ ] Mainnet/Testnet toggle
  - [ ] Network status indicators
  - [ ] Network information

- [ ] **Network Switching**
  - [ ] Seamless network switching
  - [ ] State preservation
  - [ ] Connection validation

- [ ] **User Preferences**
  - [ ] Default network setting
  - [ ] Network preference storage
  - [ ] Auto-switching logic

### **9. `TonGasEstimator.tsx` - Gas Estimator**
- [ ] **Gas Estimation**
  - [ ] Real-time gas estimation
  - [ ] Gas price calculation
  - [ ] Gas limit suggestions

- [ ] **User Controls**
  - [ ] Gas price adjustment
  - [ ] Gas limit modification
  - [ ] Priority fee settings

- [ ] **Gas Information**
  - [ ] Network gas statistics
  - [ ] Historical gas prices
  - [ ] Gas optimization tips

## 📱 **App Router Pages (`src/app/ton-swap/` & `src/app/ton-wallet/`)**

### **1. `page.tsx` - Main Pages**
- [ ] **Page Structure**
  - [ ] Next.js App Router pages
  - [ ] SEO optimization
  - [ ] Meta tags

- [ ] **Component Integration**
  - [ ] Layout components
  - [ ] Navigation
  - [ ] Error boundaries

- [ ] **Data Fetching**
  - [ ] Server-side data fetching
  - [ ] Client-side data fetching
  - [ ] Data caching

### **2. `layout.tsx` - Page Layouts**
- [ ] **Layout Structure**
  - [ ] Common layout elements
  - [ ] Navigation components
  - [ ] Footer components

- [ ] **Provider Integration**
  - [ ] TON providers
  - [ ] State management
  - [ ] Theme providers

### **3. `loading.tsx` - Loading States**
- [ ] **Loading UI**
  - [ ] Skeleton components
  - [ ] Progress indicators
  - [ ] Loading messages

### **4. `error.tsx` - Error Handling**
- [ ] **Error UI**
  - [ ] Error messages
  - [ ] Retry mechanisms
  - [ ] Error reporting

## 🧪 **Test Files**

### **1. Unit Tests (`tests/ton.test.ts`)**
- [ ] **TON Integration Tests**
  - [ ] Provider connection tests
  - [ ] Transaction building tests
  - [ ] Address validation tests

### **2. Integration Tests (`tests/integration/`)**
- [ ] **End-to-End Tests**
  - [ ] Complete swap flow tests
  - [ ] Cross-chain communication tests
  - [ ] Resolver workflow tests

### **3. Component Tests (`tests/components/`)**
- [ ] **Component Testing**
  - [ ] React Testing Library tests
  - [ ] User interaction tests
  - [ ] Accessibility tests

## ⚙️ **Configuration Files**

### **1. `ton.config.ts` - TON Compiler Configuration**
- [ ] **Compiler Settings**
  - [ ] FunC compiler configuration
  - [ ] Build targets
  - [ ] Optimization settings

- [ ] **Network Configuration**
  - [ ] Network endpoints
  - [ ] API configurations
  - [ ] Contract addresses

## 📊 **Implementation Priority**

### **Phase 1: Core Infrastructure**
1. TON Provider and basic connection
2. Address management utilities
3. Basic transaction building
4. Simple UI components

### **Phase 2: HTLC Implementation**
1. HTLC contract development
2. HTLC manager implementation
3. Basic swap functionality
4. Transaction monitoring

### **Phase 3: Advanced Features**
1. Jetton integration
2. Auction system
3. Resolver staking
4. Advanced UI components

### **Phase 4: Testing & Optimization**
1. Comprehensive testing
2. Performance optimization
3. Security auditing
4. Documentation

## 🔒 **Security Considerations**

- [ ] **Smart Contract Security**
  - [ ] Reentrancy protection
  - [ ] Access control
  - [ ] Input validation
  - [ ] Gas optimization

- [ ] **Frontend Security**
  - [ ] Input sanitization
  - [ ] XSS protection
  - [ ] CSRF protection
  - [ ] Secure communication

- [ ] **Integration Security**
  - [ ] API key management
  - [ ] Rate limiting
  - [ ] Error handling
  - [ ] Logging and monitoring

## 📈 **Performance Optimization**

- [ ] **Smart Contract Optimization**
  - [ ] Gas usage optimization
  - [ ] Storage optimization
  - [ ] Computation optimization

- [ ] **Frontend Optimization**
  - [ ] Code splitting
  - [ ] Lazy loading
  - [ ] Caching strategies
  - [ ] Bundle optimization

## 📚 **Documentation Requirements**

- [ ] **Code Documentation**
  - [ ] Function documentation
  - [ ] API documentation
  - [ ] Component documentation

- [ ] **User Documentation**
  - [ ] User guides
  - [ ] API documentation
  - [ ] Troubleshooting guides

---

**Note**: This checklist should be updated as implementation progresses. Each item should be marked as complete when the corresponding functionality is implemented and tested. 