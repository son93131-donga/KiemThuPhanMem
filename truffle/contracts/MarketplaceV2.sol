// SPDX-License-Identifier: MIT
// Dong A University - Smart Contract (last update: v0.8.18)
pragma solidity ^0.8.18;

contract MarketplaceV2 {
  enum ItemState {
    Create,
    Paid
  }

  struct Item {
    string name;
    uint256 price;
    address owner;
    ItemState state;
  }

  uint256 private _itemId;

  mapping(uint256 => Item) public items;

  event ItemUpdated(uint256 itemId, ItemState itemState);

  function totalSupply() public view returns (uint256) {
    return _itemId;
  }

  function createItem(string memory name, uint256 price) public {
    items[_itemId] = Item(name, price, msg.sender, ItemState.Create);
    emit ItemUpdated(_itemId, ItemState.Create);
    _itemId++;
  }

  function purchaseItem(uint256 itemId) public payable {
    Item memory item = items[itemId];
    require(item.price == msg.value, "MarketplaceV2: Only full payment accepted!");
    require(item.state == ItemState.Create, "MarketplaceV2: Item has been purchased!");
    require(item.owner != msg.sender, "MarketplaceV2: The buyer is seller!");
    payable(item.owner).transfer(item.price);
    items[itemId].owner = msg.sender;
    items[itemId].state = ItemState.Paid;
    emit ItemUpdated(itemId, ItemState.Paid);
  }
}
