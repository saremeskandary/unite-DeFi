// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

library ReentrancyGuard {
    // Ported from cross-chain-swap ReentrancyGuard for TRON
    
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    
    struct GuardData {
        uint256 _status;
    }
    
    function _notEntered(GuardData storage guard) internal view returns (bool) {
        return guard._status != _ENTERED;
    }
    
    function _entered(GuardData storage guard) internal view returns (bool) {
        return guard._status == _ENTERED;
    }
    
    function _enter(GuardData storage guard) internal {
        // On the first call to nonReentrant, _notEntered will be true
        require(guard._status != _ENTERED, "ReentrancyGuard: reentrant call");
        
        // Any calls to nonReentrant after this point will fail
        guard._status = _ENTERED;
    }
    
    function _exit(GuardData storage guard) internal {
        // By storing the original value once again, a refund is triggered (see
        // https://eips.ethereum.org/EIPS/eip-2200)
        guard._status = _NOT_ENTERED;
    }
    
    modifier nonReentrant(GuardData storage guard) {
        _enter(guard);
        _;
        _exit(guard);
    }
} 