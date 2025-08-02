// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "./interfaces/IEscrowFactory.sol";
import "./interfaces/IEscrowSrc.sol";
import "./interfaces/IEscrowDst.sol";
import "./EscrowSrc.sol";
import "./libraries/SafeMathTRX.sol";
import "./libraries/AddressLib.sol";
import "./libraries/ReentrancyGuard.sol";

contract EscrowFactory is IEscrowFactory {
    using SafeMathTRX for uint256;
    using AddressLib for address;
    using ReentrancyGuard for ReentrancyGuard.GuardData;
    
    // Ported from cross-chain-swap EscrowFactory
    
    mapping(address => address[]) public userEscrows;
    address[] public allEscrows;
    mapping(address => bool) public isEscrow;
    
    ReentrancyGuard.GuardData private _guardData;
    
    constructor() {
        // Initialize factory
    }
    
    function createEscrow(
        address recipient,
        uint256 timelock,
        bytes32 sourceEscrowId
    ) external payable override nonReentrant(_guardData) returns (address) {
        require(recipient != address(0), "Invalid recipient");
        require(timelock > 0, "Invalid timelock");
        require(msg.value > 0, "Amount must be greater than 0");
        
        // Create new escrow contract
        EscrowSrc newEscrow = new EscrowSrc();
        address escrowAddress = address(newEscrow);
        
        // Initialize the escrow
        newEscrow.initialize{value: msg.value}(
            msg.sender,
            recipient,
            timelock,
            sourceEscrowId
        );
        
        // Track the escrow
        userEscrows[msg.sender].push(escrowAddress);
        allEscrows.push(escrowAddress);
        isEscrow[escrowAddress] = true;
        
        emit EscrowCreated(escrowAddress, msg.sender, block.timestamp);
        
        return escrowAddress;
    }
    
    function getUserEscrows(address user) external view override returns (address[] memory) {
        return userEscrows[user];
    }
    
    function getAllEscrows() external view override returns (address[] memory) {
        return allEscrows;
    }
    
    function getEscrowCount() external view override returns (uint256) {
        return allEscrows.length;
    }
    
    function isValidEscrow(address escrow) external view override returns (bool) {
        return isEscrow[escrow];
    }
} 