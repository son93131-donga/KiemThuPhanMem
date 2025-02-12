
import { useCallback, useEffect, useState } from 'react';
import { useEth } from '../../contexts/EthContext';
import './Marketplace.css';

const ITEM_STATE = {
  Created: '0',
  Paid: '1',
  Delivered: '2',
};

export function Marketplace() {
  const { state: { accounts, contract } } = useEth();
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemDescription, setNewItemDescription] = useState(''); // Thêm description
  const [imageFile, setImageFile] = useState(null); // Thêm image
  const [listItem, setListItem] = useState([]);
  const [ratings, setRatings] = useState({});

  const contractAddress = contract?._address || 'Loading...';
  const yourAddress = accounts?.[0] || 'Loading...';

  const getListItem = useCallback(async () => {
    if (!contract) return;

    try {
        const totalSupply = await contract.methods.totalSupply().call();
        const itemPromises = [];
        for (let itemId = 0; itemId < Number(totalSupply); itemId++) {
            itemPromises.push(
                (async () => {
                    const item = await contract.methods.items(itemId).call();
                    const itemAddress = await contract.methods.getItemAddress(itemId).call();
                    const { name, owner, price, state } = item;

                    const response = await fetch(`http://localhost:5000/api/products/name/${name}`);
                    const { description, image } = await response.json();

                    return { id: itemId, name, owner, price, state, itemAddress, description, image };
                })()
            );
        }
        const items = await Promise.all(itemPromises);
        setListItem(items);
    } catch (error) {
        console.error("Lỗi khi lấy danh sách sản phẩm:", error);
    }
  }, [contract]);

  useEffect(() => {
    if (contract && accounts) {
      getListItem();
      loadRatings(); // Tải rating từ localStorage khi component mount
    }
  }, [contract, accounts, getListItem]);
  
  // Hàm tải ratings từ localStorage
  const loadRatings = () => {
    const storedRatings = localStorage.getItem('itemRatings');
    if (storedRatings) {
      setRatings(JSON.parse(storedRatings)); // Cập nhật ratings từ localStorage
    }
  };

  const handleRatingClick = async (itemId, rating) => {
    // Kiểm tra nếu đã đánh giá
    if (ratings[itemId] !== undefined) {
      alert("Bạn đã đánh giá sản phẩm này rồi.");
      return; 
    }
  
    try {
      console.log(`Submitting rating for item ${itemId} with value: ${rating}`);
      await contract.methods.rateItem(itemId, rating).send({ from: yourAddress });
  
      // Cập nhật rating trong state
      const newRatings = { ...ratings, [itemId]: rating };
      setRatings(newRatings);
      localStorage.setItem('itemRatings', JSON.stringify(newRatings)); // Lưu vào localStorage
  
      // Cập nhật lại danh sách sau khi đánh giá
      getListItem();  
      alert("Đánh giá thành công!"); // Thông báo thành công
    } catch (error) {
      console.error('Rating failed', error);
      alert("Đánh giá thất bại. Vui lòng thử lại."); // Thông báo lỗi
    }
  };

  const createItem = async () => {
    if (!newItemName || !newItemPrice || !newItemDescription || !imageFile) {
      console.error("Bạn cần điền đầy đủ thông tin trước khi tạo sản phẩm.");
      return;
    }

    // Tạo sản phẩm trong smart contract
    try {
      await contract.methods.createItem(newItemName, newItemPrice).send({ from: yourAddress });

      // Sau khi tạo sản phẩm trong smart contract, lưu thông tin vào MongoDB qua API
      const formData = new FormData();
      formData.append('name', newItemName);
      formData.append('price', newItemPrice);
      formData.append('description', newItemDescription);
      formData.append('image', imageFile);

      const response = await fetch('http://localhost:5000/api/products', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Lỗi khi lưu sản phẩm vào cơ sở dữ liệu.');
      }

      setNewItemName('');
      setNewItemPrice('');
      setNewItemDescription('');
      setImageFile(null);

      getListItem(); // Cập nhật lại danh sách sau khi tạo
    } catch (error) {
      console.error('Failed to create item', error);
    }
  };

  const purchaseItem = async (itemId, price) => {
    if (!accounts || !contract) return;
    try {
      await contract.methods.purchaseItem(itemId).send({
        from: yourAddress,
        value: price,
      });
      getListItem();
    } catch (error) {
      console.error('Purchase failed', error);
    }
  };

  const deliverItem = async (itemId) => {
    try {
      await contract.methods.deliveryItem(itemId).send({
        from: yourAddress,
        gas: 300000,
      });
      getListItem();
    } catch (error) {
      console.error('Delivery failed', error);
    }
  };

  const renderStars = (itemId) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          style={{
            cursor: ratings[itemId] ? 'default' : 'pointer',
            fontSize: '24px',
            color: ratings[itemId] >= i ? 'gold' : 'lightgray',
          }}
          onClick={() => ratings[itemId] ? null : handleRatingClick(itemId, i)}
        >
          ☆
        </span>
      );
    }
    return stars;
  };

  const renderProductImage = (imageUrl) => {
    if (!imageUrl) return <p>No image available</p>;
    return <img src={imageUrl} alt="Product" style={{ maxWidth: '100%', height: 'auto', borderRadius: '4px', marginBottom: '10px' }} />;
  };

  return (
    <div>
      {/* Phần giới thiệu */}
      <div className="intro-section">
        <h1>Welcome to the Marketplace</h1>
        <p>Discover amazing products and shop now!</p>
        <button onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}>
          Explore Marketplace
        </button>
      </div>


      {/* Phần Marketplace */}
      <div className="marketplace-container">
        <h1>Marketplace</h1>
        <p>Contract Address: {contractAddress}</p>
        <p>Your Address: {yourAddress}</p>

        <div className="create-item-form">
          <input
            type="text"
            placeholder="Item Name"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
          />
          <input
            type="number"
            placeholder="Item Price (wei)"
            value={newItemPrice}
            onChange={(e) => setNewItemPrice(e.target.value)}
          />
          <textarea
            placeholder="Item Description"
            value={newItemDescription}
            onChange={(e) => setNewItemDescription(e.target.value)}
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files[0])}
          />
          <button onClick={createItem}>Create Item</button>
        </div>

        <div className="menu-container">
          {['Items', 'Paid', 'Delivered'].map((section, index) => (
            <div className="menu-column" key={index}>
              <h2>{section}</h2>
              {listItem
                .filter(
                  (item) =>
                    item.state ===
                    (section === 'Items'
                      ? ITEM_STATE.Created
                      : section === 'Paid'
                        ? ITEM_STATE.Paid
                        : ITEM_STATE.Delivered)
                )
                .map((item) => (
                  <div className="item-card" key={item.id}>
                    <h5>Item #{item.id}</h5>
                    <p>Name: {item.name}</p>
                    <p>Description: {item.description}</p> {/* Hiển thị mô tả */}
                    {renderProductImage(item.image)}
                    <p>Price: {item.price} wei</p>
                    <p>Owner: {item.owner}</p>
                    <p>Item Address: {item.itemAddress}</p>
                    {item.state === ITEM_STATE.Delivered ? (
                      <div>
                        {renderStars(item.id)}
                      </div>
                    ) : (
                      <div
                        className="m-2 btn btn-success px-5"
                        style={{
                          pointerEvents: item.state === ITEM_STATE.Paid ? 'none' : 'auto',
                          opacity: item.state === ITEM_STATE.Paid ? 0.6 : 1,
                        }}
                        onClick={() =>
                          item.state !== ITEM_STATE.Paid && purchaseItem(item.id, item.price)
                        }
                      >
                        Buy
                      </div>
                    )}

                    {item.state === ITEM_STATE.Paid && item.owner === yourAddress && (
                      <button
                        className="m-2 btn btn-info px-5"
                        onClick={() => deliverItem(item.id)}
                      >
                        Deliver
                      </button>
                    )}
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
