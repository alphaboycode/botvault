// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {WBOT} from "../src/WBOT.sol";
import {BotVault} from "../src/BotVault.sol";

contract DeployScript is Script {
    function run() external returns (WBOT wbot, BotVault vault) {
        vm.startBroadcast();

        wbot = new WBOT();
        vault = new BotVault(wbot);

        vm.stopBroadcast();

        console.log("WBOT deployed to:", address(wbot));
        console.log("BotVault deployed to:", address(vault));
    }
}
