import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import './ProductCard.css';

import { API_URL } from '../config';

const conditionLabels = {
  '全新': { text: '全新', class: 'condition-new' },
  '几乎全新': { text: '几乎全新', class: 'condition-like-new' },
  '轻微使用': { text: '轻微使用', class: 'condition-good' },
  '明显使用': { text: '明显使用', class: 'condition-fair' },
  '老化损坏': { text: '老化损坏', class: 'condition-poor' }
};

function ProductCard({ product }) {
  const { isAuthenticated } = useContext(AuthContext);
  const [isFavorite, setIsFavorite] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);

  const images = product.images || [];
  const currentImage = images[imageIndex]?.original || '/placeholder.png';

  const handleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      alert('请先登录');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (isFavorite) {
        await axios.delete(`${API_URL}/favorites/${product.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API_URL}/favorites/${product.id}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('Favorite action failed:', error);
    }
  };

  const handleNextImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (images.length > 1) {
      setImageIndex((prev) => (prev + 1) % images.length);
    }
  };

  const handlePrevImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (images.length > 1) {
      setImageIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  const condition = conditionLabels[product.condition] || conditionLabels['轻微使用'];

  return (
    <Link to={`/product/${product.id}`} className="product-card">
      <div className="product-image-container">
        <img
          src={currentImage}
          alt={product.title}
          className="product-image"
          onError={(e) => {
            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23f0f0f0" width="200" height="200"/%3E%3Ctext fill="%23999" font-family="Arial" font-size="14" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3E暂无图片%3C/text%3E%3C/svg%3E';
          }}
        />

        {images.length > 1 && (
          <>
            <button className="image-nav-btn prev" onClick={handlePrevImage}>‹</button>
            <button className="image-nav-btn next" onClick={handleNextImage}>›</button>
            <div className="image-dots">
              {images.map((_, idx) => (
                <span
                  key={idx}
                  className={`image-dot ${idx === imageIndex ? 'active' : ''}`}
                />
              ))}
            </div>
          </>
        )}

        <button
          className={`favorite-btn ${isFavorite ? 'active' : ''}`}
          onClick={handleFavorite}
        >
          {isFavorite ? '❤️' : '🤍'}
        </button>

        <span className={`condition-badge ${condition.class}`}>
          {condition.text}
        </span>
      </div>

      <div className="product-info">
        <h3 className="product-title">{product.title}</h3>
        <p className="product-price">
          <span className="price-value">{product.price}</span>
        </p>
        <div className="product-meta">
          <span className="product-category">{product.category}</span>
          <span className="product-views">👁 {product.viewCount || 0}</span>
        </div>
      </div>
    </Link>
  );
}

export default ProductCard;