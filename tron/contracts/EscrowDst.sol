// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "./interfaces/IEscrowDst.sol";
import "./libraries/SafeMathTRX.sol";
import "./libraries/TimelocksLib.sol";
import "./libraries/AddressLib.sol";
import "./libraries/ReentrancyGuard.sol";

contract EscrowDst is IEscrowDst {
    using SafeMathTRX for uint256;
    using TimelocksLib for uint256;
    using AddressLib for address;
    using ReentrancyGuard for ReentrancyGuard.GuardData;
    
    // Ported from cross-chain-swap EscrowDst
    
    mapping(bytes32 => DestinationEscrow) public destinationEscrows;
    mapping(address => bytes32[]) public userDestinationEscrowIds;
    mapping(bytes32 => bytes32) public sourceToDestinationMapping;
    
    address public override factory;
    bool public override initialized;
    
    ReentrancyGuard.GuardData private _guardData;
    
    modifier onlyFactory() {
        require(msg.sender == factory, "Only factory can call this");
        _;
    }
    
    modifier onlySender(bytes32 escrowId) {
        require(destinationEscrows[escrowId].sender == msg.sender, "Only sender can call this");
        _;
    }
    
    modifier onlyActive(bytes32 escrowId) {
        require(destinationEscrows[escrowId].isActive, "Escrow is not active");
        _;
    }
    
    constructor() {
        factory = msg.sender;
    }
    
    function initialize(
        address _sender,
        address _recipient,
        uint256 _timelock,
        bytes32 _sourceEscrowId,
        bytes32 _destinationEscrowId
    ) external payable override {
        require(!initialized, "Already initialized");
        require(msg.sender == factory, "Only factory can initialize");
        require(_sender != address(0), "Invalid sender");
        require(_recipient != address(0), "Invalid recipient");
        require(_timelock > 0, "Invalid timelock");
        require(msg.value > 0, "Amount must be greater than 0");
        require(_sourceEscrowId != bytes32(0), "Invalid source escrow ID");
        require(_destinationEscrowId != bytes32(0), "Invalid destination escrow ID");
        
        destinationEscrows[_destinationEscrowId] = DestinationEscrow({
            sender: _sender,
            recipient: _recipient,
            amount: msg.value,
            timelock: _timelock,
            startTime: block.timestamp,
            isActive: true,
            isCompleted: false,
            isCancelled: false,
            sourceEscrowId: _sourceEscrowId,
            destinationEscrowId: _destinationEscrowId
        });
        
        userDestinationEscrowIds[_sender].push(_destinationEscrowId);
        sourceToDestinationMapping[_sourceEscrowId] = _destinationEscrowId;
        
        emit DestinationEscrowCreated(_destinationEscrowId, _sourceEscrowId, _sender, msg.value);
        
        initialized = true;
    }
    
    function completeDestinationEscrow(bytes32 escrowId) external override onlyActive(escrowId) nonReentrant(_guardData) {
        DestinationEscrow storage escrow = destinationEscrows[escrowId];
        require(msg.sender == escrow.recipient, "Only recipient can complete");
        require(block.timestamp >= escrow.startTime + escrow.timelock, "Timelock not expired");
        
        escrow.isActive = false;
        escrow.isCompleted = true;
        
        uint256 amount = escrow.amount;
        escrow.amount = 0;
        
        AddressLib.sendValue(payable(escrow.recipient), amount);
        
        emit DestinationEscrowCompleted(escrowId, escrow.recipient, amount);
    }
    
    function cancelDestinationEscrow(bytes32 escrowId) external override onlyActive(escrowId) onlySender(escrowId) nonReentrant(_guardData) {
        DestinationEscrow storage escrow = destinationEscrows[escrowId];
        require(block.timestamp >= escrow.startTime + escrow.timelock, "Timelock not expired");
        
        escrow.isActive = false;
        escrow.isCancelled = true;
        
        uint256 amount = escrow.amount;
        escrow.amount = 0;
        
        AddressLib.sendValue(payable(escrow.sender), amount);
        
        emit DestinationEscrowCancelled(escrowId, escrow.sender, amount);
    }
    
    function getDestinationEscrow(bytes32 escrowId) external view override returns (DestinationEscrow memory) {
        return destinationEscrows[escrowId];
    }
    
    function getUserDestinationEscrows(address user) external view override returns (bytes32[] memory) {
        return userDestinationEscrowIds[user];
    }
    
    function getDestinationEscrowBySource(bytes32 sourceEscrowId) external view override returns (bytes32) {
        return sourceToDestinationMapping[sourceEscrowId];
    }
    
    function isDestinationExpired(bytes32 escrowId) external view override returns (bool) {
        DestinationEscrow storage escrow = destinationEscrows[escrowId];
        return block.timestamp >= escrow.startTime + escrow.timelock;
    }
    
    function getDestinationTimeRemaining(bytes32 escrowId) external view override returns (uint256) {
        DestinationEscrow storage escrow = destinationEscrows[escrowId];
        if (block.timestamp >= escrow.startTime + escrow.timelock) {
            return 0;
        }
        return escrow.startTime + escrow.timelock - block.timestamp;
    }
} 