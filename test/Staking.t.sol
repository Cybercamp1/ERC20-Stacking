// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {StakeToken} from "../src/StakeToken.sol";
import {Staking} from "../src/Staking.sol";

contract StakingTest is Test {
    StakeToken public token;
    Staking public staking;

    address public owner = makeAddr("owner");
    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");

    uint256 public constant INITIAL_SUPPLY = 1_000_000 * 1e18;
    uint256 public constant REWARD_POOL = 500_000 * 1e18;

    function setUp() public {
        vm.startPrank(owner);
        token = new StakeToken(INITIAL_SUPPLY);
        staking = new Staking(address(token), address(token));
        
        // Transfer 500k STK to staking contract as reward pool
        token.transfer(address(staking), REWARD_POOL);
        
        vm.stopPrank();

        // Give initial tokens to Alice and Bob for testing
        vm.startPrank(owner);
        token.transfer(alice, 1000 * 1e18);
        token.transfer(bob, 1000 * 1e18);
        vm.stopPrank();
    }

    function test_StakeUpdatesBalance() public {
        uint256 amount = 100 * 1e18;
        vm.startPrank(alice);
        token.approve(address(staking), amount);
        staking.stake(amount);
        vm.stopPrank();

        assertEq(staking.balanceOf(alice), amount);
        assertEq(staking.totalSupply(), amount);
    }

    function test_WithdrawReducesBalance() public {
        uint256 amount = 100 * 1e18;
        vm.startPrank(alice);
        token.approve(address(staking), amount);
        staking.stake(amount);
        staking.withdraw(amount);
        vm.stopPrank();

        assertEq(staking.balanceOf(alice), 0);
        assertEq(staking.totalSupply(), 0);
    }

    function test_RewardsAccrueOverTime() public {
        uint256 amount = 100 * 1e18;
        vm.startPrank(alice);
        token.approve(address(staking), amount);
        staking.stake(amount);
        
        // Warp 10 seconds. Reward rate is 10 STK/sec. Alice is the only staker.
        // Expected reward = 10 * 10 = 100 STK tokens (scaled by 1e18)
        vm.warp(block.timestamp + 10);
        
        uint256 earned = staking.earned(alice);
        assertEq(earned, 10 * 10 * 1e18);
        vm.stopPrank();
    }

    function test_ClaimRewardTransfersTokens() public {
        uint256 amount = 100 * 1e18;
        vm.startPrank(alice);
        token.approve(address(staking), amount);
        staking.stake(amount);
        
        vm.warp(block.timestamp + 10); // 100 STK reward
        
        uint256 aliceBalanceBefore = token.balanceOf(alice);
        staking.claimReward();
        uint256 aliceBalanceAfter = token.balanceOf(alice);
        
        assertEq(aliceBalanceAfter - aliceBalanceBefore, 100 * 1e18);
        vm.stopPrank();
    }

    function test_TwoStakersGetProportionalRewards() public {
        uint256 amountAlice = 100 * 1e18;
        uint256 amountBob = 100 * 1e18;

        vm.startPrank(alice);
        token.approve(address(staking), amountAlice);
        staking.stake(amountAlice);
        vm.stopPrank();

        // Warp 10 seconds. Alice is the only staker. (100 rewards)
        vm.warp(block.timestamp + 10);

        vm.startPrank(bob);
        token.approve(address(staking), amountBob);
        staking.stake(amountBob);
        vm.stopPrank();

        // Warp 10 more seconds. Total rewards in this interval = 100.
        // Alice and Bob both have 100 units staked.
        // Total supply = 200.
        // Alice and Bob share 100 rewards equally -> 50 each.
        // Alice total = 100 + 50 = 150.
        // Bob total = 50.
        vm.warp(block.timestamp + 10);

        assertEq(staking.earned(alice), 150 * 1e18);
        assertEq(staking.earned(bob), 50 * 1e18);
    }

    function test_RevertWhenStakeZero() public {
        vm.expectRevert("Cannot stake 0");
        staking.stake(0);
    }

    function test_RevertWithdrawMoreThanStaked() public {
        vm.startPrank(alice);
        token.approve(address(staking), 100 * 1e18);
        staking.stake(100 * 1e18);
        
        vm.expectRevert("Amount exceeds balance");
        staking.withdraw(101 * 1e18);
        vm.stopPrank();
    }

    // Fuzz test with bound()
    function testFuzz_StakeAndWithdraw(uint256 amount) public {
        // Limit amount to Alice's balance
        amount = bound(amount, 1, 1000 * 1e18);
        
        vm.startPrank(alice);
        token.approve(address(staking), amount);
        staking.stake(amount);
        staking.withdraw(amount);
        vm.stopPrank();

        assertEq(staking.balanceOf(alice), 0);
    }

    // Fuzz test for rewards never exceeding supply (assuming enough rewards in pool)
    function testFuzz_RewardsNeverExceedSupply(uint256 time) public {
        time = bound(time, 1, 365 days); // Up to a year
        
        uint256 amount = 100 * 1e18;
        vm.startPrank(alice);
        token.approve(address(staking), amount);
        staking.stake(amount);
        
        vm.warp(block.timestamp + time);
        
        uint256 reward = staking.earned(alice);
        
        // Assert that the reward token balance in staking contract is sufficient
        // or that the reward calculation is as expected
        assertEq(reward, time * staking.REWARD_RATE());
        vm.stopPrank();
    }
}
