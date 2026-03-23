// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title StakeToken
 * @dev Simple ERC20 token for staking rewards.
 * All initial tokens are minted to the deployer.
 * Owner can mint more tokens for rewards as needed.
 */
contract StakeToken is ERC20, Ownable {
    constructor(uint256 initialSupply) ERC20("StakeToken", "STK") Ownable(msg.sender) {
        _mint(msg.sender, initialSupply);
    }

    /**
     * @dev Allows the owner to mint more STK tokens for reward payouts.
     * @param to The address to receive the minted tokens.
     * @param amount The amount of tokens to mint.
     */
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}
