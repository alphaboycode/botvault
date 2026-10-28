// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IWBOT is IERC20 {
    function deposit() external payable;
    function withdraw(uint256 wad) external;
}

/**
 * @title WBOT
 * @dev WETH9-style wrapper for native BOT token. 1 WBOT = 1 BOT.
 */
contract WBOT is ERC20, IWBOT {
    event Deposit(address indexed dst, uint256 wad);
    event Withdrawal(address indexed src, uint256 wad);

    error NativeTransferFailed();

    constructor() ERC20("Wrapped BOT", "WBOT") {}

    function deposit() public payable override {
        _mint(msg.sender, msg.value);
        emit Deposit(msg.sender, msg.value);
    }

    function withdraw(uint256 wad) public override {
        _burn(msg.sender, wad);
        emit Withdrawal(msg.sender, wad);
        (bool success, ) = msg.sender.call{value: wad}("");
        if (!success) revert NativeTransferFailed();
    }

    receive() external payable {
        deposit();
    }

    fallback() external payable {
        deposit();
    }
}
