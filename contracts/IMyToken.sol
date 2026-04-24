// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IMyToken {
    event Transfer(address indexed from, address indexed to, uint256 amount);
    function transfer(address to, uint256 amount) external;
    function getBalance(address user) external view returns (uint256);
}