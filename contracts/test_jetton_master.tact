import "@stdlib/deploy";

/**
 * @title TestJettonMaster - Test Jetton Master Contract
 * @author TonFusion Team
 * @notice A simple jetton master contract for testing purposes
 * @dev This contract is used only for testing EVM integration
 * 
 * @custom:version 1.0.0
 * @custom:test-only This contract is only used for testing
 */
contract TestJettonMaster with Deployable {
    
    /// @notice Jetton name
    name: String;
    
    /// @notice Jetton symbol
    symbol: String;
    
    /// @notice Jetton decimals
    decimals: Int as uint8;
    
    /// @notice Jetton owner
    owner: Address;
    
    /// @notice Jetton content
    content: Cell;
    
    /// @notice Total supply
    totalSupply: Int as uint256;
    
    /// @notice Jetton wallets mapping
    wallets: map<Address, Address> = emptyMap();

    init(name: String, symbol: String, decimals: Int as uint8, owner: Address, content: Cell) {
        self.name = name;
        self.symbol = symbol;
        self.decimals = decimals;
        self.owner = owner;
        self.content = content;
        self.totalSupply = 0;
    }

    /**
     * @notice Get jetton wallet address for owner
     * @param ownerAddress Owner address
     * @return Wallet address
     */
    fun getWalletAddress(ownerAddress: Address): Address {
        let walletAddress = self.wallets.get(ownerAddress);
        if (walletAddress == null) {
            // For testing purposes, return the same address
            walletAddress = ownerAddress;
        }
        return walletAddress!!;
    }

    /**
     * @notice Mint new jettons
     * @param to Recipient address
     * @param amount Amount to mint
     */
    receive("mint") {
        // Only owner can mint
        // Note: In a real implementation, you would check the sender
        // For testing purposes, we'll allow minting
        
        // Update total supply
        self.totalSupply = self.totalSupply + 1000; // Mint 1000 tokens for testing
    }

    /**
     * @notice Get jetton metadata
     * @return Jetton name
     */
    fun getJettonName(): String {
        return self.name;
    }

    /**
     * @notice Get jetton symbol
     * @return Jetton symbol
     */
    fun getJettonSymbol(): String {
        return self.symbol;
    }

    /**
     * @notice Get jetton decimals
     * @return Jetton decimals
     */
    fun getJettonDecimals(): Int {
        return self.decimals;
    }
} 