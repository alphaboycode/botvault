// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {WBOT} from "../../src/WBOT.sol";
import {BotVault} from "../../src/BotVault.sol";
import {BotVaultHandler} from "./BotVaultHandler.sol";
import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";

contract BotVaultInvariantTest is Test {
    WBOT public wbot;
    BotVault public vault;
    BotVaultHandler public handler;

    function setUp() public {
        wbot = new WBOT();
        vault = new BotVault(wbot);
        handler = new BotVaultHandler(wbot, vault);

        targetContract(address(handler));
    }

    // Invariant 1: totalAssets always equals the vault's WBOT balance
    function invariant_totalAssetsEqualsWBOTBalance() public view {
        assertEq(
            vault.totalAssets(),
            wbot.balanceOf(address(vault)),
            "totalAssets must strictly equal vault's WBOT balance"
        );
    }

    // Invariant 2: No user can redeem more than their share of total assets, and cannot redeem more shares than owned
    function invariant_noUserCanRedeemMoreThanShare() public {
        address[] memory actors = handler.getActors();
        uint256 vaultTotalAssets = vault.totalAssets();

        for (uint256 i = 0; i < actors.length; i++) {
            address actor = actors[i];
            uint256 userShares = vault.balanceOf(actor);

            // User's previewRedeem must never exceed vault totalAssets
            uint256 redeemable = vault.previewRedeem(userShares);
            assertLe(
                redeemable,
                vaultTotalAssets,
                "User redeemable assets cannot exceed vault totalAssets"
            );

            // Attempting to redeem more shares than owned must revert
            vm.startPrank(actor);
            vm.expectRevert(
                abi.encodeWithSelector(
                    ERC4626.ERC4626ExceededMaxRedeem.selector,
                    actor,
                    userShares + 1,
                    userShares
                )
            );
            vault.redeemNative(userShares + 1);
            vm.stopPrank();
        }
    }
}
