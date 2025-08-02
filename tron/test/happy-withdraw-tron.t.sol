// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "forge-std/Test.sol";
import "../contracts/EscrowFactory.sol";
import "../contracts/EscrowSrc.sol";
import "../contracts/EscrowDst.sol";

contract HappyWithdrawTronTest is Test {
    // Ported from cross-chain-swap happy-withdraw-tron.t.sol
    
    EscrowFactory public factory;
    EscrowSrc public escrowSrc;
    EscrowDst public escrowDst;
    
    address public alice = address(0x1);
    address public bob = address(0x2);
    address public charlie = address(0x3);
    
    bytes32 public testSourceEscrowId = keccak256("test-source-escrow");
    bytes32 public testDestinationEscrowId = keccak256("test-destination-escrow");
    
    function setUp() public {
        factory = new EscrowFactory();
        escrowSrc = new EscrowSrc();
        escrowDst = new EscrowDst();
        
        vm.deal(alice, 100 ether);
        vm.deal(bob, 100 ether);
        vm.deal(charlie, 100 ether);
    }
    
    function testHappyWithdrawFlow() public {
        uint256 initialBalance = alice.balance;
        uint256 escrowAmount = 1 ether;
        uint256 timelock = 3600; // 1 hour
        
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
        
        vm.startPrank(bob);
        
        // Complete escrow
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
        
        // Verify completion
        assertEq(bob.balance, 100 ether + escrowAmount, "Bob should receive funds");
        
        vm.stopPrank();
    }
    
    function testMultipleWithdrawals() public {
        uint256 escrowAmount = 0.5 ether;
        uint256 timelock = 1800; // 30 minutes
        
        // Create multiple escrows
        vm.startPrank(alice);
        
        address escrow1 = factory.createEscrow{value: escrowAmount}(
            bob,
            timelock,
            testSourceEscrowId
        );
        
        address escrow2 = factory.createEscrow{value: escrowAmount}(
            charlie,
            timelock,
            testSourceEscrowId
        );
        
        vm.stopPrank();
        
        // Fast forward time
        vm.warp(block.timestamp + timelock + 1);
        
        // Complete both escrows
        vm.prank(bob);
        EscrowSrc(escrow1).completeEscrow(keccak256(abi.encodePacked(
            alice, bob, escrowAmount, timelock, block.timestamp - timelock - 1, testSourceEscrowId
        )));
        
        vm.prank(charlie);
        EscrowSrc(escrow2).completeEscrow(keccak256(abi.encodePacked(
            alice, charlie, escrowAmount, timelock, block.timestamp - timelock - 1, testSourceEscrowId
        )));
        
        // Verify both recipients received funds
        assertEq(bob.balance, 100 ether + escrowAmount, "Bob should receive funds");
        assertEq(charlie.balance, 100 ether + escrowAmount, "Charlie should receive funds");
    }
    
    function testWithdrawWithDifferentAmounts() public {
        uint256[] memory amounts = new uint256[](3);
        amounts[0] = 0.1 ether;
        amounts[1] = 1 ether;
        amounts[2] = 5 ether;
        
        uint256 timelock = 900; // 15 minutes
        
        vm.startPrank(alice);
        
        for (uint256 i = 0; i < amounts.length; i++) {
            factory.createEscrow{value: amounts[i]}(
                bob,
                timelock,
                testSourceEscrowId
            );
        }
        
        vm.stopPrank();
        
        // Fast forward time
        vm.warp(block.timestamp + timelock + 1);
        
        // Complete all escrows
        vm.startPrank(bob);
        
        for (uint256 i = 0; i < amounts.length; i++) {
            bytes32 escrowId = keccak256(abi.encodePacked(
                alice, bob, amounts[i], timelock, block.timestamp - timelock - 1, testSourceEscrowId
            ));
            
            // Get the escrow address from factory
            address[] memory userEscrows = factory.getUserEscrows(alice);
            EscrowSrc escrowContract = EscrowSrc(userEscrows[i]);
            escrowContract.completeEscrow(escrowId);
        }
        
        vm.stopPrank();
        
        // Verify total amount received
        uint256 totalAmount = amounts[0] + amounts[1] + amounts[2];
        assertEq(bob.balance, 100 ether + totalAmount, "Bob should receive total funds");
    }
} 