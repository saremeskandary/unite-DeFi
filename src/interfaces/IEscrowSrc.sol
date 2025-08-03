// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

interface IEscrowSrc {
    // Structs
    struct Escrow {
        address sender;
        address recipient;
        uint256 amount;
        uint256 timelock;
        uint256 startTime;
        bool isActive;
        bool isCompleted;
        bool isCancelled;
        bytes32 sourceEscrowId;
    }
    
    // Events
    event EscrowCreated(bytes32 indexed escrowId, address indexed sender, uint256 amount, uint256 timelock);
    event EscrowCompleted(bytes32 indexed escrowId, address indexed recipient, uint256 amount);
    event EscrowCancelled(bytes32 indexed escrowId, address indexed sender, uint256 amount);
    
    // Core functions
    function initialize(
        address _sender,
        address _recipient,
        uint256 _timelock,
        bytes32 _sourceEscrowId
    ) external payable;
    
    function completeEscrow(bytes32 escrowId) external;
    function cancelEscrow(bytes32 escrowId) external;
    
    // View functions
    function getEscrow(bytes32 escrowId) external view returns (Escrow memory);
    function getUserEscrows(address user) external view returns (bytes32[] memory);
    function isExpired(bytes32 escrowId) external view returns (bool);
    function getTimeRemaining(bytes32 escrowId) external view returns (uint256);
    
    // State variables
    function factory() external view returns (address);
    function initialized() external view returns (bool);
} 