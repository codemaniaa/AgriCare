import React, { useState, useEffect } from 'react';
import { auctionsAPI, productsAPI } from '../api';
import { useNavigate } from 'react-router-dom';

export default function CreateAuctionPage() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    product: '',
    base_price: '',
    min_bid_increment: 5,
    auction_end: ''
  });

  const navigate = useNavigate();

  useEffect(() => {
    productsAPI.myProducts().then(res => setProducts(res.data));
  }, []);

  const handleSubmit = async () => {
    try {
      await auctionsAPI.create(form);
      alert('✅ Auction Created!');
      navigate('/auctions');
    } catch (err) {
      alert('❌ Failed');
    }
  };

  return (
     <div style={{ padding:20 }}>
      <h2>Create Auction</h2>

      {/* Product Select */}
      <select value={form.product}
        onChange={e => setForm({ ...form, product: e.target.value })}
      >
        <option value="">Select Product</option>
        {products.map(p => (
          <option key={p.id} value={p.id}>{p.title}</option>
        ))}
      </select>

      <br /><br />

      {/* Base Price */}
      <input
        type="number"
        placeholder="Base Price"
        value={form.base_price}
        onChange={e => setForm({ ...form, base_price: e.target.value })}
      />

      <br /><br />

      {/* Increment */}
      <input
        type="number"
        placeholder="Min Increment"
        value={form.min_bid_increment}
        onChange={e => setForm({ ...form, min_bid_increment: e.target.value })}
      />

      <br /><br />

      {/* End Time */}
      <input type="datetime-local" value={form.auction_end}  onChange={e => setForm({ ...form, auction_end: e.target.value })}/>

      <br /><br />

      <button onClick={handleSubmit}>
        Create Auction
      </button>
    </div>
  );
}