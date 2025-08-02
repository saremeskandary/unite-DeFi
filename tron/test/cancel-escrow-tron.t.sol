// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "forge-std/Test.sol";
import "../contracts/EscrowFactory.sol";
import "../contracts/EscrowSrc.sol";
import "../contracts/EscrowDst.sol";

contract CancelEscrowTronTest is Test {
    // Ported from cross-chain-swap cancel-escrow-tron.t.sol
    
    EscrowFactory public factory;
    EscrowSrc public escrowSrc;
    EscrowDst public escrowDst;
    
    address public alice = address(0x1);
    address public bob = address(0x2);
    address public charlie = address(0x3);
    
    bytes32 public testSourceEscrowId = keccak256("test-source-escrow");
    
    function setUp() public {
        factory = new EscrowFactory();
        escrowSrc = new EscrowSrc();
        escrowDst = new EscrowDst();
        
        vm.deal(alice, 100 ether);
        vm.deal(bob, 100 ether);
        vm.deal(charlie, 100 ether);
    }
    
    function testCancelEscrowBySender() public {
        uint256 escrowAmount = 1 ether;
        uint256 timelock = 3600; // 1 hour
        uint256 initialBalance = alice.balance;
        
        vm.startPrank(alice);
        
        // Create escrow
        address escrowAddress = factory.createEscrow{value: escrowAmount}(
            bob,
            timelock,
            testSourceEscrowId
        );
        
        // Verify escrow creation
        assertTrue(escrowAddress != address(0), "Escrow should be created");
        assertEq(alice.balance, initialBalance - escrowAmount, "Balance should be reduced");
        
        vm.stopPrank();
        
        // Fast forward time past timelock
        vm.warp(block.timestamp + timelock + 1);
        
        vm.startPrank(alice);
        
        // Cancel escrow
        EscrowSrc escrowContract = EscrowSrc(escrowAddress);
        bytes32 escrowId = keccak256(abi.encodePacked(
            alice,
            bob,
            escrowAmount,
            timelock,
            block.timestamp - timelock - 1,
            testSourceEscrowId
        ));
        
        escrowContract.cancelEscrow(escrowId);
        
        // Verify cancellation
        assertEq(alice.balance, initialBalance, "Alice should get funds back");
        
        vm.stopPrank();
    }
    
    function testCancelEscrowAfterTimelock() public {
        uint256 escrowAmount = 0.5 ether;
        uint256 timelock = 1800; // 30 minutes
        
        vm.startPrank(alice);
        
        address escrowAddress = factory.createEscrow{value: escrowAmount}(
            bob,
            timelock,
            testSourceEscrowId
        );
        
        vm.stopPrank();
        
        // Try to cancel before timelock expires (should fail)
        vm.startPrank(alice);
        
        EscrowSrc escrowContract = EscrowSrc(escrowAddress);
        bytes32 escrowId = keccak256(abi.encodePacked(
            alice,
            bob,
            escrowAmount,
            timelock,
            block.timestamp,
            testSourceEscrowId
        ));
        
        vm.expectRevert("Timelock not expired");
        escrowContract.cancelEscrow(escrowId);
        
        vm.stopPrank();
        
        // Fast forward time and cancel (should succeed)
        vm.warp(block.timestamp + timelock + 1);
        
        vm.prank(alice);
        escrowContract.cancelEscrow(escrowId);
        
        // Verify cancellation
        assertEq(alice.balance, 100 ether, "Alice should get funds back");
    }
    
    function testCannotCancelByNonSender() public {
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
        
        // Try to cancel with different user (should fail)
        vm.startPrank(charlie);
        
        EscrowSrc escrowContract = EscrowSrc(escrowAddress);
        bytes32 escrowId = keccak256(abi.encodePacked(
            alice,
            bob,
            escrowAmount,
            timelock,
            block.timestamp - timelock - 1,
            testSourceEscrowId
        ));
        
        vm.expectRevert("Only sender can call this");
        escrowContract.cancelEscrow(escrowId);
        
        vm.stopPrank();
    }
    
    function testCannotCancelCompletedEscrow() public {
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
        
        // Complete escrow first
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
        
        // Try to cancel completed escrow (should fail)
        vm.startPrank(alice);
        
        vm.expectRevert("Escrow is not active");
        escrowContract.cancelEscrow(escrowId);
        
        vm.stopPrank();
    }
} 