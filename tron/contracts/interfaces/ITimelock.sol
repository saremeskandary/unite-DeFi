// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

interface ITimelock {
    // Structs
    struct TimelockData {
        uint256 startTime;
        uint256 duration;
        bool isActive;
        bool isExpired;
        uint256 remainingTime;
    }
    
    // Core functions
    function createTimelock(uint256 duration) external view returns (TimelockData memory);
    function isExpired(TimelockData memory timelock) external view returns (bool);
    function getRemainingTime(TimelockData memory timelock) external view returns (uint256);
    function getTimelockStatus(TimelockData memory timelock) external view returns (
        bool isActive,
        bool isExpired,
        uint256 remainingTime,
        uint256 elapsedTime
    );
} 