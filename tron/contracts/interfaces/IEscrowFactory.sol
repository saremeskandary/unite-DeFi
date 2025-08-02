// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

interface IEscrowFactory {
    // Events
    event EscrowCreated(address indexed escrow, address indexed creator, uint256 timestamp);
    event EscrowCompleted(address indexed escrow, address indexed recipient, uint256 amount);
    event EscrowCancelled(address indexed escrow, address indexed sender, uint256 amount);
    
    // Core functions
    function createEscrow(
        address recipient,
        uint256 timelock,
        bytes32 sourceEscrowId
    ) external payable returns (address);
    
    // View functions
    function getUserEscrows(address user) external view returns (address[] memory);
    function getAllEscrows() external view returns (address[] memory);
    function getEscrowCount() external view returns (uint256);
    function isValidEscrow(address escrow) external view returns (bool);
} 