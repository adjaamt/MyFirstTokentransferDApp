// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import "./IMyToken.sol";

abstract contract MyTokenBase is IMyToken {
    mapping(address => uint256) public balances;

    function getBalance(address user) public view override returns (uint256) {
        return balances[user];
    }

    // Child contracts must decide how the fee is calculated.
    function _calculateFee(uint256 amount) internal virtual pure returns (uint256);

    function transfer(address to, uint256 amount) public override {
        uint256 fee = _calculateFee(amount);
        require(balances[msg.sender] >= amount + fee, "Insufficient balance");

        balances[msg.sender] -= amount + fee;
        balances[to] += amount;

        emit Transfer(msg.sender, to, amount);
    }
}