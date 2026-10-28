// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {WBOT} from "../../src/WBOT.sol";
import {BotVault} from "../../src/BotVault.sol";

contract BotVaultHandler is Test {
    WBOT public wbot;
    BotVault public vault;

    address[] public actors;
    address internal currentActor;

    constructor(WBOT _wbot, BotVault _vault) {
        wbot = _wbot;
        vault = _vault;

        actors.push(address(0x1001));
        actors.push(address(0x1002));
        actors.push(address(0x1003));

        for (uint256 i = 0; i < actors.length; i++) {
            vm.deal(actors[i], 1_000_000 ether);
        }
    }

    modifier useActor(uint256 actorIndex) {
        currentActor = actors[actorIndex % actors.length];
        vm.startPrank(currentActor);
        _;
        vm.stopPrank();
    }

    function depositNative(uint256 actorIndex, uint256 amount) public useActor(actorIndex) {
        amount = bound(amount, 1, 100 ether);
        vault.depositNative{value: amount}();
    }

    function redeemNative(uint256 actorIndex, uint256 shareAmount) public useActor(actorIndex) {
        uint256 userShares = vault.balanceOf(currentActor);
        if (userShares == 0) return;
        shareAmount = bound(shareAmount, 1, userShares);
        vault.redeemNative(shareAmount);
    }

    function depositWBOT(uint256 actorIndex, uint256 amount) public useActor(actorIndex) {
        amount = bound(amount, 1, 100 ether);
        wbot.deposit{value: amount}();
        wbot.approve(address(vault), amount);
        vault.deposit(amount, currentActor);
    }

    function redeemWBOT(uint256 actorIndex, uint256 shareAmount) public useActor(actorIndex) {
        uint256 userShares = vault.balanceOf(currentActor);
        if (userShares == 0) return;
        shareAmount = bound(shareAmount, 1, userShares);
        vault.redeem(shareAmount, currentActor, currentActor);
    }

    function donateWBOT(uint256 amount) public {
        amount = bound(amount, 1, 50 ether);
        vm.deal(address(this), amount);
        wbot.deposit{value: amount}();
        wbot.transfer(address(vault), amount);
    }

    function getActors() external view returns (address[] memory) {
        return actors;
    }
}
