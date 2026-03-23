// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

/**
 * @title Staking Protocol
 * @author Sai Nithish (Junior Blockchain Developer)
 * @dev Staking contract for STK tokens with Synthetix rewardPerToken formula.
 */

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Staking is ReentrancyGuard {
    using SafeERC20 for IERC20;

    /**
     * @dev Reward Distribution Logic Explained:
     * We use a "rewardPerToken" accumulator to handle many users efficiently.
     * instead of iterating through all users, each action updates the global
     * `rewardPerTokenStored`.
     * 
     * Formula:
     * newRewardPerToken = rewardPerTokenStored + (rewardRate * timePassed * 1e18) / totalSupply
     * 
     * We use 1e18 scaling for fixed-point math to avoid precision loss when
     * rewardRate is small or totalSupply is large.
     */

    IERC20 public immutable stakingToken;
    IERC20 public immutable rewardToken;

    uint256 public constant REWARD_RATE = 10 * 1e18; // 10 tokens per second
    uint256 public rewardPerTokenStored;
    uint256 public lastUpdateTime;

    uint256 private _totalSupply;
    mapping(address => uint256) private _balances;
    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;

    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardClaimed(address indexed user, uint256 amount);

    /**
     * @param _stakingToken The ERC20 token to stake.
     * @param _rewardToken The ERC20 token to distribute as rewards.
     */
    constructor(address _stakingToken, address _rewardToken) {
        stakingToken = IERC20(_stakingToken);
        rewardToken = IERC20(_rewardToken);
        lastUpdateTime = block.timestamp;
    }

    /**
     * @dev Updates common state variables before any state-changing action.
     * @param user The address involved (optional, zero if none).
     */
    modifier updateReward(address user) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = block.timestamp;
        if (user != address(0)) {
            rewards[user] = earned(user);
            userRewardPerTokenPaid[user] = rewardPerTokenStored;
        }
        _;
    }

    /**
     * @return currentRewardPerToken Accumulated reward value for 1 stake unit (scaled by 1e18).
     */
    function rewardPerToken() public view returns (uint256) {
        if (_totalSupply == 0) {
            return rewardPerTokenStored;
        }
        return
            rewardPerTokenStored +
            (REWARD_RATE * (block.timestamp - lastUpdateTime) * 1e18) /
            _totalSupply;
    }

    /**
     * @param account The address of the staker.
     * @return earnedTokens Total claimable reward tokens for a user.
     */
    function earned(address account) public view returns (uint256) {
        return
            ((_balances[account] *
                (rewardPerToken() - userRewardPerTokenPaid[account])) / 1e18) +
            rewards[account];
    }

    /**
     * @dev User stakes STK tokens to earn rewards.
     * @param amount STK amount to stake.
     */
    function stake(uint256 amount) public nonReentrant updateReward(msg.sender) {
        require(amount > 0, "Cannot stake 0");
        _totalSupply += amount;
        _balances[msg.sender] += amount;
        stakingToken.safeTransferFrom(msg.sender, address(this), amount);
        emit Staked(msg.sender, amount);
    }

    /**
     * @dev User withdraws their STK tokens.
     * @param amount STK amount to withdraw.
     */
    function withdraw(uint256 amount) public nonReentrant updateReward(msg.sender) {
        require(amount > 0, "Cannot withdraw 0");
        require(amount <= _balances[msg.sender], "Amount exceeds balance");
        _totalSupply -= amount;
        _balances[msg.sender] -= amount;
        stakingToken.safeTransfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }

    /**
     * @dev User claims accumulated STK rewards.
     */
    function claimReward() public nonReentrant updateReward(msg.sender) {
        uint256 reward = rewards[msg.sender];
        if (reward > 0) {
            rewards[msg.sender] = 0;
            rewardToken.safeTransfer(msg.sender, reward);
            emit RewardClaimed(msg.sender, reward);
        }
    }

    /**
     * @dev Utility to claim and withdraw at once.
     */
    function exit() external {
        withdraw(_balances[msg.sender]);
        claimReward();
    }

    // View functions for transparency
    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) external view returns (uint256) {
        return _balances[account];
    }
}
