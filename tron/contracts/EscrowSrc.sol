// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "./interfaces/IEscrowSrc.sol";
import "./libraries/SafeMathTRX.sol";
import "./libraries/TimelocksLib.sol";
import "./libraries/AddressLib.sol";
import "./libraries/ReentrancyGuard.sol";

contract EscrowSrc is IEscrowSrc {
    using SafeMathTRX for uint256;
    using TimelocksLib for uint256;
    using AddressLib for address;
    using ReentrancyGuard for ReentrancyGuard.GuardData;
    
    // Ported from cross-chain-swap EscrowSrc
    
    mapping(bytes32 => Escrow) public escrows;
    mapping(address => bytes32[]) public userEscrowIds;
    
    address public override factory;
    bool public override initialized;
    
    ReentrancyGuard.GuardData private _guardData;
    
    modifier onlyFactory() {
        require(msg.sender == factory, "Only factory can call this");
        _;
    }
    
    modifier onlySender(bytes32 escrowId) {
        require(escrows[escrowId].sender == msg.sender, "Only sender can call this");
        _;
    }
    
    modifier onlyActive(bytes32 escrowId) {
        require(escrows[escrowId].isActive, "Escrow is not active");
        _;
    }
    
    constructor() {
        factory = msg.sender;
    }
    
    function initialize(
        address _sender,
        address _recipient,
        uint256 _timelock,
        bytes32 _sourceEscrowId
    ) external payable override {
        require(!initialized, "Already initialized");
        require(msg.sender == factory, "Only factory can initialize");
        require(_sender != address(0), "Invalid sender");
        require(_recipient != address(0), "Invalid recipient");
        require(_timelock > 0, "Invalid timelock");
        require(msg.value > 0, "Amount must be greater than 0");
        
        bytes32 escrowId = keccak256(abi.encodePacked(
            _sender,
            _recipient,
            msg.value,
            _timelock,
            block.timestamp,
            _sourceEscrowId
        ));
        
        escrows[escrowId] = Escrow({
            sender: _sender,
            recipient: _recipient,
            amount: msg.value,
            timelock: _timelock,
            startTime: block.timestamp,
            isActive: true,
            isCompleted: false,
            isCancelled: false,
            sourceEscrowId: _sourceEscrowId
        });
        
        userEscrowIds[_sender].push(escrowId);
        
        emit EscrowCreated(escrowId, _sender, msg.value, _timelock);
        
        initialized = true;
    }
    
    function completeEscrow(bytes32 escrowId) external override onlyActive(escrowId) nonReentrant(_guardData) {
        Escrow storage escrow = escrows[escrowId];
        require(msg.sender == escrow.recipient, "Only recipient can complete");
        require(block.timestamp >= escrow.startTime + escrow.timelock, "Timelock not expired");
        
        escrow.isActive = false;
        escrow.isCompleted = true;
        
        uint256 amount = escrow.amount;
        escrow.amount = 0;
        
        AddressLib.sendValue(payable(escrow.recipient), amount);
        
        emit EscrowCompleted(escrowId, escrow.recipient, amount);
    }
    
    function cancelEscrow(bytes32 escrowId) external override onlyActive(escrowId) onlySender(escrowId) nonReentrant(_guardData) {
        Escrow storage escrow = escrows[escrowId];
        require(block.timestamp >= escrow.startTime + escrow.timelock, "Timelock not expired");
        
        escrow.isActive = false;
        escrow.isCancelled = true;
        
        uint256 amount = escrow.amount;
        escrow.amount = 0;
        
        AddressLib.sendValue(payable(escrow.sender), amount);
        
        emit EscrowCancelled(escrowId, escrow.sender, amount);
    }
    
    function getEscrow(bytes32 escrowId) external view override returns (Escrow memory) {
        return escrows[escrowId];
    }
    
    function getUserEscrows(address user) external view override returns (bytes32[] memory) {
        return userEscrowIds[user];
    }
    
    function isExpired(bytes32 escrowId) external view override returns (bool) {
        Escrow storage escrow = escrows[escrowId];
        return block.timestamp >= escrow.startTime + escrow.timelock;
    }
    
    function getTimeRemaining(bytes32 escrowId) external view override returns (uint256) {
        Escrow storage escrow = escrows[escrowId];
        if (block.timestamp >= escrow.startTime + escrow.timelock) {
            return 0;
        }
        return escrow.startTime + escrow.timelock - block.timestamp;
    }
} 