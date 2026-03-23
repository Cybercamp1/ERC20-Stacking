export const STAKE_TOKEN_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address, address) view returns (uint256)",
  "function approve(address spacer, uint256 amount) returns (bool)",
  "function mint(address to, uint256 amount) returns (bool)"
];

export const STAKING_ABI = [
  "function stakingToken() view returns (address)",
  "function rewardToken() view returns (address)",
  "function REWARD_RATE() view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function earned(address) view returns (uint256)",
  "function rewardPerToken() view returns (uint256)",
  "function stake(uint256 amount)",
  "function withdraw(uint256 amount)",
  "function claimReward()",
  "function exit()",
  "event Staked(address indexed user, uint256 amount)",
  "event Withdrawn(address indexed user, uint256 amount)",
  "event RewardClaimed(address indexed user, uint256 amount)"
];

// Placeholders for deployment addresses
export const STAKE_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_STAKE_TOKEN_ADDRESS || "0x0000000000000000000000000000000000000000";
export const STAKING_ADDRESS = process.env.NEXT_PUBLIC_STAKING_ADDRESS || "0x0000000000000000000000000000000000000000";
