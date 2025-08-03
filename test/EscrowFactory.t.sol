// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "forge-std/Test.sol";
import "../src/EscrowFactory.sol";

contract EscrowFactoryTest is Test {
    EscrowFactory public escrowFactory;
    address public owner;
    address public user1;
    address public user2;

    function setUp() public {
        owner = address(this);
        user1 = address(0x1);
        user2 = address(0x2);

        escrowFactory = new EscrowFactory();
    }

    function test_DeployEscrowFactory() public {
        assertEq(address(escrowFactory) != address(0), true);
    }

    function test_CreateEscrow() public {
        // Add test logic for creating escrow
        // This is a placeholder - implement based on your EscrowFactory contract
        vm.prank(user1);
        // escrowFactory.createEscrow(...);
        // assertEq(...);
    }
}
