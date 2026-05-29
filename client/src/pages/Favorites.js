import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ProductCard from '../components/ProductCard';
import './Favorites.css';

import { API_URL } from '../config';

function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/favorites`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFavorites(response.data);
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (productId, e) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/favorites/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFavorites(favorites.filter(p => p.id !== productId));
    } catch (error) {
      console.error('Failed to remove favorite:', error);
    }
  };

  return (
    <div className="favorites-page">
      <div className="page-header">
        <h1>我的收藏</h1>
        <span className="favorites-count">{favorites.length} 个商品</span>
      </div>

      {loading ? (
        <div className="loading">加载中...</div>
      ) : favorites.length === 0 ? (
        <div className="empty-state">
          <p>你还没有收藏任何商品</p>
          <p className="text-secondary mt-10">去发现喜欢的宝贝吧</p>
        </div>
      ) : (
        <div className="favorites-grid">
          {favorites.map(product => (
            <div key={product.id} className="favorite-item">
              <ProductCard product={product} />
              <button
                className="remove-favorite-btn"
                onClick={(e) => handleRemove(product.id, e)}
              >
                取消收藏
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Favorites;