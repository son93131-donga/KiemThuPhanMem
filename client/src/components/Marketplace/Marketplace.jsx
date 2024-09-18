import { useCallback, useEffect, useState } from 'react';
import { useEth } from '../../contexts/EthContext'

const ITEM_STATE = {
  Created: '0',
  Paid: '1'
}

export function Marketplace(props) {
  const { state: { accounts, contract } } = useEth();

  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [listItem, setListItem] = useState([]);

  const getListItem = useCallback(async (contract) => {
    const totalSupply = await contract.methods.totalSupply().call();
    const totalSupplyNumber = Number(totalSupply);
    const _listItem = [];
    for (let itemId = 0; itemId < totalSupplyNumber; itemId++) {
      const item = await contract.methods.items(itemId).call();
      const { name, owner, price, state } = item;
      _listItem.push({ name, owner, price, state, id: itemId })
    }
    setListItem(_listItem);
  }, [])

  useEffect(() => {
    if (contract) getListItem(contract);
  }, [contract, getListItem])

  const createItem = async () => {
    await contract.methods
      .createItem(newItemName, newItemPrice)
      .send({ from: accounts[0] });

    getListItem(contract);
    setNewItemName('');
    setNewItemPrice('');
  }

  const purchaseItem = async (itemId, itemPrice) => {
    await contract.methods
      .purchaseItem(itemId)
      .send({ from: accounts[0], value: itemPrice });

    getListItem(contract);
  }

  return (
    <div className="container">
      <h1>Marketplace</h1>
      <hr />
      <p>
        Contract address: {contract?.options?.address}
      </p>
      <div className='bg-white rounded-3 shadow-sm p-3'>
        <p className='fs-4'>Create item</p>
        <input
          className='form-control my-3'
          type='text'
          placeholder='Item name'
          name='newItemName'
          value={newItemName}
          onChange={event => setNewItemName(event.target.value)}
        />
        <input
          className='form-control my-3'
          type='text'
          placeholder='Item price'
          name='newItemPrice'
          value={newItemPrice}
          onChange={event => setNewItemPrice(event.target.value)}
        />
        <div className='btn btn-primary' onClick={createItem}>
          Create
        </div>
      </div>

      <div className='bg-white rounded-3 shadow-sm p-3 mt-3'>
        <div className='row'>
          {listItem?.map(item => (
            <div className='col-6 col-lg-3' key={item.id}>
              <div className='rounded-3 shadow-sm border border-success'>
                <div className='text-center bg-success rounded-top-3 p-3'>
                  <p className='fs-3 text-light'>
                    Item #{item.id}
                    <br />
                    Owner: 0x...{item.owner.substring(39)}
                    <br />
                    (ITEM PICTURE)
                  </p>
                </div>

                <div className='p-2'>
                  <b>{item.name}</b>
                  <br />
                  Price: {item.price} wei
                </div>

                <div
                  className={`m-2 btn btn-success px-5 ${item.state.toString() === ITEM_STATE.Paid && "disabled"}`}
                  onClick={() => purchaseItem(item.id, item.price)}
                >
                  Buy
                </div>
              </div>
            </div>
          ))}
        </div>
        Your address: {accounts ? accounts[0] : 'Not connected'}
      </div>
    </div>
  )
}