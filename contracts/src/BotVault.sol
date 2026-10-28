// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20, ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IWBOT} from "./WBOT.sol";

/**
 * @title BotVault
 * @dev ERC-4626 vault for native BOT using WBOT as underlying asset.
 */
contract BotVault is ERC4626, ReentrancyGuard {
    error OnlyWBOT();
    error NativeTransferFailed();

    constructor(IERC20 asset_) ERC4626(asset_) ERC20("Vault BOT", "vBOT") {}

    function _decimalsOffset() internal view virtual override returns (uint8) {
        return 6;
    }

    function deposit(uint256 assets, address receiver) public virtual override nonReentrant returns (uint256) {
        return super.deposit(assets, receiver);
    }

    function mint(uint256 shares, address receiver) public virtual override nonReentrant returns (uint256) {
        return super.mint(shares, receiver);
    }

    function withdraw(uint256 assets, address receiver, address owner)
        public
        virtual
        override
        nonReentrant
        returns (uint256)
    {
        return super.withdraw(assets, receiver, owner);
    }

    function redeem(uint256 shares, address receiver, address owner)
        public
        virtual
        override
        nonReentrant
        returns (uint256)
    {
        return super.redeem(shares, receiver, owner);
    }

    function depositNative() external payable nonReentrant returns (uint256) {
        uint256 assets = msg.value;
        uint256 shares = previewDeposit(assets);

        _mint(msg.sender, shares);
        emit Deposit(msg.sender, msg.sender, assets, shares);

        IWBOT(asset()).deposit{value: assets}();
        return shares;
    }

    function redeemNative(uint256 shares) external nonReentrant returns (uint256) {
        uint256 maxShares = maxRedeem(msg.sender);
        if (shares > maxShares) {
            revert ERC4626ExceededMaxRedeem(msg.sender, shares, maxShares);
        }

        uint256 assets = previewRedeem(shares);

        _burn(msg.sender, shares);
        emit Withdraw(msg.sender, msg.sender, msg.sender, assets, shares);

        IWBOT(asset()).withdraw(assets);

        (bool success, ) = msg.sender.call{value: assets}("");
        if (!success) revert NativeTransferFailed();

        return assets;
    }

    receive() external payable {
        if (msg.sender != asset()) revert OnlyWBOT();
    }
}
