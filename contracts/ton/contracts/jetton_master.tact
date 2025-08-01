import "@stdlib/deploy";

/**
 * @title Test Jetton Master Contract
 * @author TonFusion Team
 * @notice Simple jetton master contract for testing purposes
 * @dev This contract implements the basic jetton standard for testing
 * 
 * @custom:version 1.0.0
 * @custom:warning This is a test contract and should not be used in production
 */
contract TestJettonMaster with Deployable {
    
    /// @notice Jetton metadata
    name: String;
    symbol: String;
    decimals: Int as uint8;
    
    /// @notice Total supply of the jetton
    totalSupply: Int as uint256;
    
    /// @notice Jetton wallet code
    jettonWalletCode: Cell;
    
    /// @notice Jetton master contract owner
    owner: Address;
    
    /// @notice Jetton content (metadata)
    content: Cell;
    
    init(name: String, symbol: String, decimals: Int as uint8, owner: Address, content: Cell) {
        self.name = name;
        self.symbol = symbol;
        self.decimals = decimals;
        self.owner = owner;
        self.content = content;
        self.totalSupply = 0;
        self.jettonWalletCode = getCode();
    }
    
    /**
     * @notice Mint new jettons to a specific address
     * @dev Only the owner can mint new jettons
     * @param to Address to mint jettons to
     * @param amount Amount of jettons to mint
     * @param gasAmount Amount of gas to send with the transaction
     */
    receive("mint") {
        let to: Address = sender();
        let amount: Int as uint256 = 0;
        let gasAmount: Int as coins = 0;
        
        // Parse the message body
        let cs = beginCell().endCell().beginParse();
        if (cs.remainingBits() >= 32) {
            amount = cs.loadUint(256);
        }
        if (cs.remainingBits() >= 64) {
            gasAmount = cs.loadCoins();
        }
        
        // Only owner can mint
        require(sender() == self.owner, "Only owner can mint");
        
        // Calculate jetton wallet address
        let jettonWalletAddress = calculateJettonWalletAddress(to, self.address, self.jettonWalletCode);
        
        // Send mint message to jetton wallet
        send(SendParameters{
            to: jettonWalletAddress,
            value: gasAmount,
            mode: SendRemainingValue + SendIgnoreErrors,
            body: beginCell()
                .storeUint(0x178d4519, 32) // mint opcode
                .storeAddress(to)
                .storeCoins(amount)
                .storeRef(beginCell().storeUint(0, 1).endCell()) // forward_payload
                .endCell()
        });
        
        // Update total supply
        self.totalSupply = self.totalSupply + amount;
    }
    
    /**
     * @notice Get jetton wallet address for a specific owner
     * @param ownerAddress Address of the jetton wallet owner
     * @return Jetton wallet address
     */
    fun getWalletAddress(ownerAddress: Address): Address {
        return calculateJettonWalletAddress(ownerAddress, self.address, self.jettonWalletCode);
    }
    
    /**
     * @notice Calculate jetton wallet address
     * @param ownerAddress Owner address for the jetton wallet
     * @param jettonMasterAddress Jetton master contract address
     * @param jettonWalletCode Jetton wallet code cell
     * @return Calculated jetton wallet address
     */
    fun calculateJettonWalletAddress(
        ownerAddress: Address,
        jettonMasterAddress: Address,
        jettonWalletCode: Cell
    ): Address {
        let initData = beginCell()
            .storeAddress(ownerAddress)
            .storeAddress(jettonMasterAddress)
            .endCell();
            
        return contractAddress(StateInit{
            code: jettonWalletCode,
            data: initData,
        });
    }
    
    /**
     * @notice Get jetton data
     * @return Jetton metadata
     */
    receive("get_jetton_data") {
        send(SendParameters{
            to: sender(),
            value: 0,
            mode: SendRemainingValue + SendIgnoreErrors,
            body: beginCell()
                .storeUint(0x2fcb26a2, 32) // get_jetton_data opcode
                .storeUint(0, 64) // query_id
                .storeString(self.name)
                .storeString(self.symbol)
                .storeUint(self.decimals, 8)
                .storeUint(self.totalSupply, 256)
                .storeAddress(self.owner)
                .storeRef(self.content)
                .storeRef(self.jettonWalletCode)
                .endCell()
        });
    }
} 