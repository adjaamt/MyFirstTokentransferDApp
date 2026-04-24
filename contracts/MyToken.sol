// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import "./MyTokenBase.sol";

contract MyToken is MyTokenBase {
    string public name;
    string public symbol;

    constructor(string memory _name, string memory _symbol, uint256 initialSupply) {
        name = _name;
        symbol = _symbol;
        balances[msg.sender] = initialSupply;
    }

    function _calculateFee(uint256 amount) internal pure override returns (uint256) {
        // Charge a simple 1% transfer fee.
        return amount / 100;
    }
}