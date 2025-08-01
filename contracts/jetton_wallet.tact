import "@stdlib/deploy";

/**
 * @title Test Jetton Wallet Contract
 * @author TonFusion Team
 * @notice Simple jetton wallet contract for testing purposes
 * @dev This contract implements the basic jetton wallet standard for testing
 * 
 * @custom:version 1.0.0
 * @custom:warning This is a test contract and should not be used in production
 */
contract TestJettonWallet with Deployable {
    
    /// @notice Jetton wallet owner
    owner: Address;
    
    /// @notice Jetton master contract address
    jettonMaster: Address;
    
    /// @notice Current balance of jettons
    balance: Int as uint256;
    
    /// @notice Jetton wallet code
    jettonWalletCode: Cell;
    
    init(owner: Address, jettonMaster: Address) {
        self.owner = owner;
        self.jettonMaster = jettonMaster;
        self.balance = 0;
        self.jettonWalletCode = getCode();
    }
    
    /**
     * @notice Mint jettons to this wallet
     * @dev Only the jetton master can mint to this wallet
     * @param to Address to mint jettons to (should be the owner)
     * @param amount Amount of jettons to mint
     * @param forwardPayload Optional payload to forward
     */
    receive("mint") {
        let to: Address = sender();
        let amount: Int as uint256 = 0;
        let forwardPayload: Cell? = null;
        
        // Parse the message body
        let cs = beginCell().endCell().beginParse();
        if (cs.remainingBits() >= 32) {
            to = cs.loadAddress();
        }
        if (cs.remainingBits() >= 256) {
            amount = cs.loadUint(256);
        }
        if (cs.remainingBits() >= 1) {
            let hasPayload = cs.loadBit();
            if (hasPayload) {
                forwardPayload = cs.loadRef();
            }
        }
        
        // Only jetton master can mint
        require(sender() == self.jettonMaster, "Only jetton master can mint");
        
        // Update balance
        self.balance = self.balance + amount;
        
        // Forward payload if provided
        if (forwardPayload != null) {
            send(SendParameters{
                to: to,
                value: 0,
                mode: SendRemainingValue + SendIgnoreErrors,
                body: forwardPayload
            });
        }
    }
    
    /**
     * @notice Transfer jettons to another address
     * @dev Only the owner can transfer jettons
     * @param to Address to transfer jettons to
     * @param amount Amount of jettons to transfer
     * @param responseDestination Address to send response to
     * @param customPayload Optional custom payload
     * @param forwardTonAmount Amount of TON to forward
     */
    receive("transfer") {
        let to: Address = sender();
        let amount: Int as uint256 = 0;
        let responseDestination: Address = sender();
        let customPayload: Cell? = null;
        let forwardTonAmount: Int as coins = 0;
        
        // Parse the message body
        let cs = beginCell().endCell().beginParse();
        if (cs.remainingBits() >= 32) {
            to = cs.loadAddress();
        }
        if (cs.remainingBits() >= 256) {
            amount = cs.loadUint(256);
        }
        if (cs.remainingBits() >= 32) {
            responseDestination = cs.loadAddress();
        }
        if (cs.remainingBits() >= 64) {
            forwardTonAmount = cs.loadCoins();
        }
        if (cs.remainingBits() >= 1) {
            let hasPayload = cs.loadBit();
            if (hasPayload) {
                customPayload = cs.loadRef();
            }
        }
        
        // Only owner can transfer
        require(sender() == self.owner, "Only owner can transfer");
        
        // Check balance
        require(self.balance >= amount, "Insufficient balance");
        
        // Update balance
        self.balance = self.balance - amount;
        
        // Send transfer to destination
        send(SendParameters{
            to: to,
            value: forwardTonAmount,
            mode: SendRemainingValue + SendIgnoreErrors,
            body: beginCell()
                .storeUint(0x178d4519, 32) // mint opcode
                .storeAddress(responseDestination)
                .storeCoins(amount)
                .storeRef(customPayload ?? beginCell().storeUint(0, 1).endCell())
                .endCell()
        });
    }
    
    /**
     * @notice Burn jettons
     * @dev Only the owner can burn jettons
     * @param amount Amount of jettons to burn
     * @param responseDestination Address to send response to
     * @param customPayload Optional custom payload
     */
    receive("burn") {
        let amount: Int as uint256 = 0;
        let responseDestination: Address = sender();
        let customPayload: Cell? = null;
        
        // Parse the message body
        let cs = beginCell().endCell().beginParse();
        if (cs.remainingBits() >= 256) {
            amount = cs.loadUint(256);
        }
        if (cs.remainingBits() >= 32) {
            responseDestination = cs.loadAddress();
        }
        if (cs.remainingBits() >= 1) {
            let hasPayload = cs.loadBit();
            if (hasPayload) {
                customPayload = cs.loadRef();
            }
        }
        
        // Only owner can burn
        require(sender() == self.owner, "Only owner can burn");
        
        // Check balance
        require(self.balance >= amount, "Insufficient balance");
        
        // Update balance
        self.balance = self.balance - amount;
        
        // Send burn notification to jetton master
        send(SendParameters{
            to: self.jettonMaster,
            value: 0,
            mode: SendRemainingValue + SendIgnoreErrors,
            body: beginCell()
                .storeUint(0x595f07bc, 32) // burn opcode
                .storeCoins(amount)
                .storeAddress(responseDestination)
                .storeRef(customPayload ?? beginCell().storeUint(0, 1).endCell())
                .endCell()
        });
    }
    
    /**
     * @notice Get jetton wallet data
     * @return Jetton wallet information
     */
    receive("get_wallet_data") {
        send(SendParameters{
            to: sender(),
            value: 0,
            mode: SendRemainingValue + SendIgnoreErrors,
            body: beginCell()
                .storeUint(0x2fcb26a2, 32) // get_wallet_data opcode
                .storeUint(0, 64) // query_id
                .storeCoins(self.balance)
                .storeAddress(self.owner)
                .storeAddress(self.jettonMaster)
                .storeRef(self.jettonWalletCode)
                .endCell()
        });
    }
} 