import React, { useState, useEffect } from 'react';
import { productsAPI } from '../api';
import Navbar from '../components/layout/Navbar';
import { ProductCard, Sidebar, Spinner } from '../components/common/index';
import { BottomNav } from '../components/layout/SubNavbar';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data } = await productsAPI.list();
      setProducts(data.results || data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = products.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase()) &&
    (category ? p.category === category : true)
  );

  return (
    <div className="bg-[#f8fdf9] ">
      <Navbar />

      <div className="mx-auto px-4 py-6">

        {/* 🔍 FILTER BAR */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-2 border rounded-lg"
          />

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="">All Categories</option>
            <option value="grains">Grains</option>
            <option value="fruits">Fruits</option>
            <option value="vegetables">Vegetables</option>
            <option value="livestock">Livestock</option>
          </select>
        </div>
        <div className="flex gap-6">
          <Sidebar filters={{ category }} onChange={(newFilters) => {
            setCategory(newFilters.category);
          }} />
          {/* PRODUCTS */}
        {loading ? (
          <Spinner />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 h-auto">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
        </div>
        

      </div>

      <BottomNav />
    </div>
  );
}