# ERC-20 Staking Protocol

A complete ERC-20 staking decentralized application (dApp) built with Solidity, Foundry, and OpenZeppelin. This protocol allows users to stake a custom ERC-20 token (STK) and earn rewards over time using the Synthetix "rewardPerToken" accumulator algorithm.

## Features
- **ERC-20 Staking (STK Token)**
- **Synthetix Reward Formula**: Efficient fixed-point math for reward calculation.
- **Auto-compounding Support**: Rewards accrue based on time and total supply.
- **Secure**: Reentrancy protection and safe token transfers.
- **Testing**: Comprehensive Foundry tests with fuzzing.

## Architecture Diagram (ASCII)

```text
+-----------------------+           +-----------------------+
|      USER WALLET      |           |     OWNER WALLET      |
+-----------+-----------+           +-----------+-----------+
            |                                   |
            | stake(), withdraw()               | mint(), transfer()
            | claimReward()                     | 
            v                                   v
+-----------------------+           +-----------------------+
|   Staking Contract    | <------- |   StakeToken (STK)    |
| (Uses Synthetix logic)|           |   (ERC-20 Standard)   |
+-----------------------+           +-----------------------+
```

## Contracts Documentation

### `StakeToken.sol (STK)`
- **Symbol**: STK
- **Initial Supply**: 1,000,000 STK (all to deployer).
- **Functionalities**:
    - `mint(address to, uint256 amount)`: Owner-only minting to refill reward pools.

### `Staking.sol`
- **Core Staking Logic**:
    - `stake(uint256 amount)`: Lock STK to start earning rewards.
    - `withdraw(uint256 amount)`: Retrieve staked STK.
    - `claimReward()`: Transfer accumulated STK rewards to the user.
    - `earned(address user)`: View current reward balance for a staker.
    - `rewardPerToken()`: View accumulated rewards per staked token (scaled by 1e18).

## Math & Precision
The protocol uses a fixed-point math approach to calculate rewards fairly across all users without iterating through maps.
- **Precision**: 1e18
- **Reward Rate**: 10 STK per second.
- **Accumulator**: `rewardPerTokenStored` is updated every time a state-changing action occurs, ensuring that users earn precisely what they deserve.

## Security Analysis

| Risk | Mitigation |
|------|------------|
| Reentrancy | `ReentrancyGuard` on all critical functions. |
| Token Safety | `SafeERC20` used for `transfer` and `transferFrom`. |
| Precision Loss | Uses 1e18 scaling for all accumulation math. |
| Owner Privilege | Minting is restricted to `Ownable` (owner). |

## How to Run Tests

Ensure you have Foundry installed.

1. **Install dependencies**:
```bash
forge install OpenZeppelin/openzeppelin-contracts
```

2. **Run All Tests**:
```bash
forge test
```

3. **Run Gas Snapshots**:
```bash
forge snapshot
```

## Full-Stack Experience

The project now includes a **Premium Next.js Frontend** to interact with the protocol.

### Prerequisites
- Node.js & npm
- MetaMask browser extension

### Running the Frontend
1. **Navigate to the frontend folder**:
   ```bash
   cd frontend
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Configure Environment**:
   Copy `.env.local.example` to `.env.local` and substitute the contract addresses from your deployment.
   ```bash
   cp .env.local.example .env.local
   ```
4. **Launch the development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployed Sepolia Addresses (Placeholders)
- **StakeToken**: `0x0000000000000000000000000000000000000000`
- **Staking**: `0x0000000000000000000000000000000000000000`

## Known Limitations
- **Fixed Reward Rate**: The reward rate is hardcoded at 10 tokens per second for this implementation.
- **Single Token Rewards**: Staking and rewards are currently the same token (STK).
- **No Early Withdrawal Penalty**: Users can withdraw their stake at any time without fees.

---
Built by Sai Nithish - Junior Blockchain Developer Portfolio.
