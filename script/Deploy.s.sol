// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "forge-std/Script.sol";
import "../src/EscrowFactory.sol";
import "../src/TronHTLC.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Deploy EscrowFactory
        EscrowFactory escrowFactory = new EscrowFactory();
        console.log("EscrowFactory deployed at:", address(escrowFactory));

        // Deploy TronHTLC
        TronHTLC tronHTLC = new TronHTLC();
        console.log("TronHTLC deployed at:", address(tronHTLC));

        vm.stopBroadcast();
    }
}
