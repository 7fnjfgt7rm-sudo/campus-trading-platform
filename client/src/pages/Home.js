import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import ProductCard from '../components/ProductCard';
import './Home.css';

import { API_URL } from '../config';

const categories = [
  { id: 'electronics', name: '数码电子', icon: '📱' },
  { id: 'books', name: '图书教材', icon: '📚' },
  { id: 'clothing', name: '服饰鞋包', icon: '👔' },
  { id: 'daily', name: '生活用品', icon: '🏠' },
  { id: 'sports', name: '运动户外', icon: '⚽' },
  { id: 'beauty', name: '美妆护肤', icon: '💄' },
  { id: 'other', name: '其他', icon: '📦' }
];

function Home() {
  const [products, setProducts] = useState([]);
  const [hotProducts, setHotProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
    fetchHotProducts();
  }, [selectedCategory]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedCategory) {
        params.category = selectedCategory;
      }
      const response = await axios.get(`${API_URL}/products`, { params });
      setProducts(response.data.products.slice(0, 12));
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHotProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/search/hot`);
      setHotProducts(response.data);
    } catch (error) {
      console.error('Failed to fetch hot products:', error);
    }
  };

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-content">
          <h1>校园二手交易平台</h1>
          <p>方便、快捷、安全的校内二手物品交易</p>
        </div>
      </section>

      <section className="categories-section">
        <h2 className="section-title">商品分类</h2>
        <div className="categories-grid">
          {categories.map(cat => (
            <Link
              key={cat.id}
              to={`/search?category=${cat.id}`}
              className={`category-card ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              <span className="category-icon">{cat.icon}</span>
              <span className="category-name">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="products-section">
        <div className="section-header">
          <h2 className="section-title">
            {selectedCategory
              ? categories.find(c => c.id === selectedCategory)?.name
              : '最新商品'}
          </h2>
          <Link to="/search" className="view-more">
            查看更多 →
          </Link>
        </div>

        {loading ? (
          <div className="loading">加载中...</div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <p>暂无商品</p>
            <Link to="/publish" className="btn btn-primary mt-20">
              发布第一个商品
            </Link>
          </div>
        ) : (
          <div className="products-grid">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {hotProducts.length > 0 && (
        <section className="products-section">
          <div className="section-header">
            <h2 className="section-title">🔥 热门商品</h2>
          </div>
          <div className="products-grid">
            {hotProducts.slice(0, 4).map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default Home;