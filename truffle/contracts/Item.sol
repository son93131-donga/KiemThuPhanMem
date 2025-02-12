// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

contract Item {
    uint256 public price;
    uint256 public index;
    address public manager;

    constructor(address _manager, uint256 _price, uint256 _index) {
        manager = _manager;
        price = _price;
        index = _index;
    }
}
