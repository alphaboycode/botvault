// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {WBOT} from "../src/WBOT.sol";
import {BotVault} from "../src/BotVault.sol";
import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract MaliciousReceiver is Test {
    BotVault public vault;
    bool public attacked;
    bool public reentrancyBlocked;

    constructor(BotVault _vault) {
        vault = _vault;
    }

    function deposit() external payable {
        vault.depositNative{value: msg.value}();
    }

    function attack() external {
        uint256 shares = vault.balanceOf(address(this));
        vault.redeemNative(shares);
    }

    receive() external payable {
        if (!attacked) {
            attacked = true;
            // Attempt to re-enter
            (bool success, bytes memory data) = address(vault).call(
                abi.encodeWithSelector(vault.redeemNative.selector, 1)
            );
            if (!success) {
                bytes4 selector;
                if (data.length >= 4) {
                    assembly {
                        selector := mload(add(data, 32))
                    }
                }
                if (selector == ReentrancyGuard.ReentrancyGuardReentrantCall.selector) {
                    reentrancyBlocked = true;
                }
            }
        }
    }
}

contract BotVaultTest is Test {
    WBOT public wbot;
    BotVault public vault;

    address public alice = address(0xA11CE);
    address public bob = address(0xB0B);
    address public attacker = address(0xBAD);

    function setUp() public {
        wbot = new WBOT();
        vault = new BotVault(wbot);

        vm.deal(alice, 100 ether);
        vm.deal(bob, 100 ether);
        vm.deal(attacker, 1000 ether);
    }

    // 1. depositNative then redeemNative round trip returns the same BOT
    function test_depositNative_redeemNative_roundTrip() public {
        vm.startPrank(alice);
        uint256 initialBal = alice.balance;
        uint256 depositAmt = 5 ether;

        uint256 shares = vault.depositNative{value: depositAmt}();
        assertGt(shares, 0, "Shares should be > 0");
        assertEq(alice.balance, initialBal - depositAmt, "Alice balance should decrease by depositAmt");
        assertEq(vault.totalAssets(), depositAmt, "totalAssets should equal depositAmt");

        uint256 assetsReturned = vault.redeemNative(shares);
        assertEq(assetsReturned, depositAmt, "Assets returned should equal depositAmt");
        assertEq(alice.balance, initialBal, "Alice should have exact initial balance back");
        assertEq(vault.balanceOf(alice), 0, "Alice shares should be 0");
        vm.stopPrank();
    }

    // 2. standard ERC-4626 deposit/redeem with WBOT works too
    function test_erc4626_deposit_redeem_with_wbot() public {
        vm.startPrank(alice);
        uint256 depositAmt = 4 ether;

        // Alice wraps BOT into WBOT
        wbot.deposit{value: depositAmt}();
        assertEq(wbot.balanceOf(alice), depositAmt);

        // Approve vault
        wbot.approve(address(vault), depositAmt);

        // Standard ERC4626 deposit
        uint256 shares = vault.deposit(depositAmt, alice);
        assertGt(shares, 0);
        assertEq(wbot.balanceOf(alice), 0);
        assertEq(vault.totalAssets(), depositAmt);

        // Standard ERC4626 redeem
        uint256 assets = vault.redeem(shares, alice, alice);
        assertEq(assets, depositAmt);
        assertEq(wbot.balanceOf(alice), depositAmt);
        assertEq(vault.balanceOf(alice), 0);
        vm.stopPrank();
    }

    // 3. multiple users get correct, proportional shares
    function test_multiple_users_proportional_shares() public {
        vm.prank(alice);
        uint256 sharesAlice = vault.depositNative{value: 10 ether}();

        vm.prank(bob);
        uint256 sharesBob = vault.depositNative{value: 20 ether}();

        // Bob deposited 2x Alice, so Bob should get 2x shares
        assertEq(sharesBob, sharesAlice * 2, "Bob should get twice the shares of Alice");

        // Redeem all
        vm.prank(alice);
        uint256 assetsAlice = vault.redeemNative(sharesAlice);
        assertEq(assetsAlice, 10 ether, "Alice gets 10 ether back");

        vm.prank(bob);
        uint256 assetsBob = vault.redeemNative(sharesBob);
        assertEq(assetsBob, 20 ether, "Bob gets 20 ether back");
    }

    // 4. redeeming more shares than owned reverts
    function test_redeeming_more_shares_than_owned_reverts() public {
        vm.startPrank(alice);
        uint256 shares = vault.depositNative{value: 2 ether}();

        // Try to redeem shares + 1
        vm.expectRevert(
            abi.encodeWithSelector(
                ERC4626.ERC4626ExceededMaxRedeem.selector,
                alice,
                shares + 1,
                shares
            )
        );
        vault.redeemNative(shares + 1);

        // Standard ERC-4626 redeem also reverts
        vm.expectRevert(
            abi.encodeWithSelector(
                ERC4626.ERC4626ExceededMaxRedeem.selector,
                alice,
                shares + 1,
                shares
            )
        );
        vault.redeem(shares + 1, alice, alice);
        vm.stopPrank();
    }

    // 5. depositNative with 0 value mints 0 shares safely
    function test_depositNative_zero_value() public {
        vm.prank(alice);
        uint256 shares = vault.depositNative{value: 0}();
        assertEq(shares, 0, "Shares minted should be 0");
        assertEq(vault.balanceOf(alice), 0, "Balance of Alice should be 0");
        assertEq(vault.totalAssets(), 0, "Total assets should be 0");
    }

    // 6. inflation attack fails: attacker donates WBOT directly, victim gets fair shares
    function test_inflation_attack_fails() public {
        // Attacker deposits 1 wei BOT
        vm.startPrank(attacker);
        uint256 attackerShares = vault.depositNative{value: 1}();
        assertGt(attackerShares, 0, "Attacker receives shares");

        // Attacker donates 100 ether of WBOT directly to vault
        wbot.deposit{value: 100 ether}();
        wbot.transfer(address(vault), 100 ether);
        vm.stopPrank();

        // Victim deposits 1 ether
        vm.startPrank(alice);
        uint256 initialAliceBal = alice.balance;
        uint256 aliceShares = vault.depositNative{value: 1 ether}();
        assertGt(aliceShares, 0, "Victim must receive non-zero shares");

        // Alice redeems immediately
        uint256 aliceRedeemed = vault.redeemNative(aliceShares);

        // Due to _decimalsOffset() = 6 virtual shares protection,
        // Alice gets back > 99% of her 1 ether deposit (fair shares),
        // and the attacker effectively loses the vast majority of their 100 ether donation.
        assertGt(aliceRedeemed, 0.99 ether, "Victim should retain fair value (> 0.99 BOT)");
        assertLe(initialAliceBal - alice.balance, 0.01 ether, "Victim loses less than 1%");
        vm.stopPrank();
    }

    // 7. reentrancy: a malicious contract that re-enters from its receive() during redeemNative is blocked
    function test_reentrancy_blocked() public {
        MaliciousReceiver malicious = new MaliciousReceiver(vault);
        vm.deal(address(malicious), 5 ether);

        malicious.deposit{value: 2 ether}();
        assertEq(vault.balanceOf(address(malicious)), vault.previewDeposit(2 ether));

        malicious.attack();
        assertTrue(malicious.reentrancyBlocked(), "Reentrancy must be blocked by ReentrancyGuard");
    }

    // 8. Direct BOT transfer to vault only accepted from WBOT
    function test_receive_rejects_direct_bot_transfer() public {
        vm.prank(alice);
        (bool ok, ) = address(vault).call{value: 1 ether}("");
        assertFalse(ok, "Direct native BOT transfer should fail");
    }
}
