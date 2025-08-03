// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

interface IEscrowDst {
    // Structs
    struct DestinationEscrow {
        address sender;
        address recipient;
        uint256 amount;
        uint256 timelock;
        uint256 startTime;
        bool isActive;
        bool isCompleted;
        bool isCancelled;
        bytes32 sourceEscrowId;
        bytes32 destinationEscrowId;
    }
    
    // Events
    event DestinationEscrowCreated(bytes32 indexed escrowId, bytes32 indexed sourceEscrowId, address indexed sender, uint256 amount);
    event DestinationEscrowCompleted(bytes32 indexed escrowId, address indexed recipient, uint256 amount);
    event DestinationEscrowCancelled(bytes32 indexed escrowId, address indexed sender, uint256 amount);
    
    // Core functions
    function initialize(
        address _sender,
        address _recipient,
        uint256 _timelock,
        bytes32 _sourceEscrowId,
        bytes32 _destinationEscrowId
    ) external payable;
    
    function completeDestinationEscrow(bytes32 escrowId) external;
    function cancelDestinationEscrow(bytes32 escrowId) external;
    
    // View functions
    function getDestinationEscrow(bytes32 escrowId) external view returns (DestinationEscrow memory);
    function getUserDestinationEscrows(address user) external view returns (bytes32[] memory);
    function getDestinationEscrowBySource(bytes32 sourceEscrowId) external view returns (bytes32);
    function isDestinationExpired(bytes32 escrowId) external view returns (bool);
    function getDestinationTimeRemaining(bytes32 escrowId) external view returns (uint256);
    
    // State variables
    function factory() external view returns (address);
    function initialized() external view returns (bool);
} 