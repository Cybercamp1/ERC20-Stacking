// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {StakeToken} from "../src/StakeToken.sol";
import {Staking} from "../src/Staking.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envOr("PRIVATE_KEY", uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80)); // Default Anvil key 0
        // Using broadcast for actual deployment
        vm.startBroadcast(deployerPrivateKey);

        // 1,000,000 initial supply
        uint256 initialSupply = 1_000_000 * 1e18;
        StakeToken token = new StakeToken(initialSupply);

        // Deploy Staking contract with StakeToken for both staking and rewards
        Staking staking = new Staking(address(token), address(token));

        // Transfer 500,000 STK to the staking contract as a reward pool
        uint256 rewardPool = 500_000 * 1e18;
        token.transfer(address(staking), rewardPool);

        console.log("--------------- STAKING PROTOCOL DEPLOYED ---------------");
        console.log("StakeToken (STK) address: ", address(token));
        console.log("Staking contract address: ", address(staking));
        console.log("Reward Pool Transferred : ", rewardPool / 1e18, " STK");
        console.log("---------------------------------------------------------");

        vm.stopBroadcast();
    }
}
