// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {Oracle} from "../src/Oracle.sol";

contract OracleScript is Script {
    Oracle public oracle;

    function setUp() public {}

    function run() public {
        address oracleAddress = 0x031ECb63480983FD216D17BB6e1d393f3816b72F; 

        vm.startBroadcast();

        oracle = new Oracle(oracleAddress);

        vm.stopBroadcast();
    }
}