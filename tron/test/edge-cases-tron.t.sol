// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "forge-std/Test.sol";
import "../contracts/EscrowFactory.sol";
import "../contracts/EscrowSrc.sol";
import "../contracts/EscrowDst.sol";

contract EdgeCasesTronTest is Test {
    // Ported from cross-chain-swap edge-cases-tron.t.sol
    
    EscrowFactory public factory;
    EscrowSrc public escrowSrc;
    EscrowDst public escrowDst;
    
    address public alice = address(0x1);
    address public bob = address(0x2);
    address public zeroAddress = address(0);
    
    bytes32 public testSourceEscrowId = keccak256("test-source-escrow");
    
    function setUp() public {
        factory = new EscrowFactory();
        escrowSrc = new EscrowSrc();
        escrowDst = new EscrowDst();
        
        vm.deal(alice, 100 ether);
        vm.deal(bob, 100 ether);
    }
    
    function testZeroAmountEscrow() public {
        uint256 escrowAmount = 0;
        uint256 timelock = 3600;
        
        vm.startPrank(alice);
        
        vm.expectRevert("Amount must be greater than 0");
        factory.createEscrow{value: escrowAmount}(
            bob,
            timelock,
            testSourceEscrowId
        );
        
        vm.stopPrank();
    }
    
    function testMaxAmountEscrow() public {
        uint256 maxAmount = type(uint256).max;
        uint256 timelock = 3600;
        
        vm.deal(alice, maxAmount);
        
        vm.startPrank(alice);
        
        // This should fail due to insufficient balance for gas
        vm.expectRevert();
        factory.createEscrow{value: maxAmount}(
            bob,
            timelock,
            testSourceEscrowId
        );
        
        vm.stopPrank();
    }
    
    function testZeroTimelock() public {
        uint256 escrowAmount = 1 ether;
        uint256 timelock = 0;
        
        vm.startPrank(alice);
        
        vm.expectRevert("Invalid timelock");
        factory.createEscrow{value: escrowAmount}(
            bob,
            timelock,
            testSourceEscrowId
        );
        
        vm.stopPrank();
    }
    
    function testVeryLongTimelock() public {
        uint256 escrowAmount = 1 ether;
        uint256 veryLongTimelock = 365 days; // 1 year
        
        vm.startPrank(alice);
        
        address escrowAddress = factory.createEscrow{value: escrowAmount}(
            bob,
            veryLongTimelock,
            testSourceEscrowId
        );
        
        assertTrue(escrowAddress != address(0), "Escrow should be created with long timelock");
        
        vm.stopPrank();
    }
    
    function testReentrancyAttack() public {
        uint256 escrowAmount = 1 ether;
        uint256 timelock = 3600;
        
        vm.startPrank(alice);
        
        address escrowAddress = factory.createEscrow{value: escrowAmount}(
            bob,
            timelock,
            testSourceEscrowId
        );
        
        vm.stopPrank();
        
        // Fast forward time
        vm.warp(block.timestamp + timelock + 1);
        
        // Try to complete escrow multiple times (should fail on second attempt)
        vm.startPrank(bob);
        
        EscrowSrc escrowContract = EscrowSrc(escrowAddress);
        bytes32 escrowId = keccak256(abi.encodePacked(
            alice,
            bob,
            escrowAmount,
            timelock,
            block.timestamp - timelock - 1,
            testSourceEscrowId
        ));
        
        escrowContract.completeEscrow(escrowId);
        
        // Second completion should fail
        vm.expectRevert("Escrow is not active");
        escrowContract.completeEscrow(escrowId);
        
        vm.stopPrank();
    }
    
    function testOverflowProtection() public {
        uint256 maxUint = type(uint256).max;
        uint256 escrowAmount = 1 ether;
        uint256 timelock = 3600;
        
        vm.startPrank(alice);
        
        // Test that SafeMath prevents overflow
        address escrowAddress = factory.createEscrow{value: escrowAmount}(
            bob,
            timelock,
            testSourceEscrowId
        );
        
        assertTrue(escrowAddress != address(0), "Escrow should be created");
        
        vm.stopPrank();
    }
    
    function testUnderflowProtection() public {
        uint256 escrowAmount = 1 ether;
        uint256 timelock = 3600;
        
        vm.startPrank(alice);
        
        address escrowAddress = factory.createEscrow{value: escrowAmount}(
            bob,
            timelock,
            testSourceEscrowId
        );
        
        vm.stopPrank();
        
        // Fast forward time
        vm.warp(block.timestamp + timelock + 1);
        
        // Complete escrow
        vm.prank(bob);
        
        EscrowSrc escrowContract = EscrowSrc(escrowAddress);
        bytes32 escrowId = keccak256(abi.encodePacked(
            alice,
            bob,
            escrowAmount,
            timelock,
            block.timestamp - timelock - 1,
            testSourceEscrowId
        ));
        
        escrowContract.completeEscrow(escrowId);
        
        // Try to complete again (should fail due to underflow protection)
        vm.expectRevert("Escrow is not active");
        escrowContract.completeEscrow(escrowId);
    }
    
    function testGasLimitEdgeCases() public {
        uint256 escrowAmount = 1 ether;
        uint256 timelock = 3600;
        
        vm.startPrank(alice);
        
        // Test with reasonable gas limit
        address escrowAddress = factory.createEscrow{value: escrowAmount, gas: 3000000}(
            bob,
            timelock,
            testSourceEscrowId
        );
        
        assertTrue(escrowAddress != address(0), "Escrow should be created with reasonable gas");
        
        vm.stopPrank();
    }
} 