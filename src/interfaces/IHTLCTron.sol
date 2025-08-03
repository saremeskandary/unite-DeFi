// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

interface IHTLCTron {
    // Structs
    struct HTLC {
        address sender;
        address recipient;
        uint256 amount;
        bytes32 hashlock;
        uint256 timelock;
        uint256 startTime;
        bool isActive;
        bool isRedeemed;
        bool isRefunded;
        string secret; // Only populated after redemption
    }

    // Events
    event HTLCCreated(
        bytes32 indexed htlcId,
        address indexed sender,
        address indexed recipient,
        uint256 amount,
        bytes32 hashlock,
        uint256 timelock
    );

    event HTLCRedeemed(
        bytes32 indexed htlcId,
        address indexed recipient,
        string secret
    );

    event HTLCRefunded(bytes32 indexed htlcId, address indexed sender);

    // Core HTLC functions
    function createHTLC(
        address _recipient,
        bytes32 _hashlock,
        uint256 _timelock
    ) external payable returns (bytes32 htlcId);

    function redeemHTLC(bytes32 _htlcId, string calldata _secret) external;
    function refundHTLC(bytes32 _htlcId) external;

    // View functions
    function getHTLC(bytes32 _htlcId) external view returns (HTLC memory);
    function validateSecret(
        bytes32 _htlcId,
        string calldata _secret
    ) external view returns (bool);
    function isExpired(bytes32 _htlcId) external view returns (bool);
    function getTimeRemaining(bytes32 _htlcId) external view returns (uint256);
    function generateHashlock(
        string calldata _secret
    ) external pure returns (bytes32);

    // State queries
    function getSenderHTLCs(
        address _sender
    ) external view returns (bytes32[] memory);
    function getRecipientHTLCs(
        address _recipient
    ) external view returns (bytes32[] memory);
}
