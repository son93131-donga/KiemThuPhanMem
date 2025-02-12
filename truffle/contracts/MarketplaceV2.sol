// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "./Item.sol";  // Import hợp đồng phụ Item

contract MarketplaceV2 {
    enum ItemState {
        Created,
        Paid,
        Delivered
    }

    struct ItemInfo {
        Item _item;
        string name;
        uint256 price;
        address owner;
        ItemState state;
        uint8 rating;  // Thêm trường lưu trữ điểm đánh giá
        bool rated;    // Đánh dấu đã đánh giá hay chưa
    }

    uint256 private _itemId;
    mapping(uint256 => ItemInfo) public items;

    event ItemUpdated(uint256 itemId, ItemState itemState, address itemAddress);
    event ItemRated(uint256 itemId, uint8 rating, address owner);

    function totalSupply() public view returns (uint256) {
        return _itemId;
    }

    // Cập nhật createItem để tạo hợp đồng Item và sinh địa chỉ tự động
    function createItem(string memory name, uint256 price) public {
        Item newItem = new Item(address(this), price, _itemId);  // Tạo hợp đồng phụ Item
        items[_itemId]._item = newItem;
        items[_itemId].name = name;
        items[_itemId].price = price;
        items[_itemId].owner = msg.sender;
        items[_itemId].state = ItemState.Created;
        items[_itemId].rated = false;  // Mới tạo thì chưa ai đánh giá

        emit ItemUpdated(_itemId, ItemState.Created, address(newItem));  // Emit sự kiện với địa chỉ Item
        _itemId++;
    }

    function purchaseItem(uint256 itemId) public payable {
        ItemInfo memory item = items[itemId];
        require(item.price == msg.value, "MarketplaceV2: Only full payment accepted!");
        require(item.state == ItemState.Created, "MarketplaceV2: Item has been purchased!");
        require(item.owner != msg.sender, "MarketplaceV2: The buyer cannot be the seller!");

        payable(item.owner).transfer(item.price);
        items[itemId].owner = msg.sender;
        items[itemId].state = ItemState.Paid;
        emit ItemUpdated(itemId, ItemState.Paid, address(item._item));
    }

    function deliveryItem(uint256 itemId) public {
        ItemInfo memory item = items[itemId];
        require(item.owner == msg.sender, "Only the buyer can confirm delivery.");
        require(item.state == ItemState.Paid, "MarketplaceV2: The item is not at paid state");
        items[itemId].state = ItemState.Delivered;
        emit ItemUpdated(itemId, ItemState.Delivered, address(item._item));
    }

    // Hàm thêm đánh giá
    function rateItem(uint256 itemId, uint8 _rating) public {
        ItemInfo storage item = items[itemId];
        require(item.owner == msg.sender, "Only the owner can rate this item."); // Chỉ owner hiện tại được đánh giá
        require(item.state == ItemState.Delivered, "Item must be delivered to be rated."); // Chỉ có thể đánh giá khi sản phẩm đã được giao
        require(!item.rated, "You have already rated this item.");  // Chỉ được đánh giá 1 lần
        require(_rating >= 1 && _rating <= 5, "Rating must be between 1 and 5."); // Điểm đánh giá từ 1 đến 5 sao

        item.rating = _rating;  // Gán điểm đánh giá
        item.rated = true;  // Đánh dấu đã đánh giá

        emit ItemRated(itemId, _rating, msg.sender);  // Emit sự kiện khi đánh giá thành công
    }

    function getItemAddress(uint256 itemId) public view returns (address) {
        return address(items[itemId]._item);  // Trả về địa chỉ của contract phụ Item
    }

    // Hàm lấy thông tin đánh giá (nếu có)
    function getItemRating(uint256 itemId) public view returns (uint8) {
        require(items[itemId].rated, "Item has not been rated yet.");
        return items[itemId].rating;
    }
}
