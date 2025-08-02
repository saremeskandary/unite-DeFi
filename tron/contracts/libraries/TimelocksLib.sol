// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "../interfaces/ITimelock.sol";

library TimelocksLib {
    // Ported from cross-chain-swap TimelocksLib
    
    struct Timelock {
        uint256 startTime;
        uint256 duration;
        bool isActive;
        bool isExpired;
        uint256 remainingTime;
    }
    
    function createTimelock(uint256 duration) internal view returns (Timelock memory) {
        uint256 startTime = block.timestamp;
        bool isExpired = false;
        uint256 remainingTime = duration;
        
        return Timelock({
            startTime: startTime,
            duration: duration,
            isActive: true,
            isExpired: isExpired,
            remainingTime: remainingTime
        });
    }
    
    function isExpired(Timelock memory timelock) internal view returns (bool) {
        return block.timestamp >= timelock.startTime + timelock.duration;
    }
    
    function getRemainingTime(Timelock memory timelock) internal view returns (uint256) {
        if (block.timestamp >= timelock.startTime + timelock.duration) {
            return 0;
        }
        return timelock.startTime + timelock.duration - block.timestamp;
    }
    
    function extendTimelock(Timelock storage timelock, uint256 additionalDuration) internal {
        require(timelock.isActive, "Timelock is not active");
        require(!isExpired(timelock), "Timelock is already expired");
        
        timelock.duration = timelock.duration + additionalDuration;
        timelock.remainingTime = getRemainingTime(timelock);
    }
    
    function pauseTimelock(Timelock storage timelock) internal {
        require(timelock.isActive, "Timelock is not active");
        timelock.isActive = false;
    }
    
    function resumeTimelock(Timelock storage timelock) internal {
        require(!timelock.isActive, "Timelock is already active");
        timelock.isActive = true;
        timelock.startTime = block.timestamp;
    }
    
    function getTimelockStatus(Timelock memory timelock) internal view returns (
        bool isActive,
        bool isExpired,
        uint256 remainingTime,
        uint256 elapsedTime
    ) {
        isActive = timelock.isActive;
        isExpired = TimelocksLib.isExpired(timelock);
        remainingTime = TimelocksLib.getRemainingTime(timelock);
        elapsedTime = block.timestamp - timelock.startTime;
    }
} 