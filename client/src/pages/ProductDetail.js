import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import './ProductDetail.css';

import { API_URL } from '../config';

const categoryMap = {
  electronics: '数码电子',
  books: '图书教材',
  clothing: '服饰鞋包',
  daily: '日用百货',
  sports: '运动户外',
  beauty: '美妆护肤',
  other: '其他'
};

const getCategoryName = (category) => {
  return categoryMap[category] || category;
};

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useContext(AuthContext);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageIndex, setImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/products/${id}`);
      setProduct(response.data);

      if (isAuthenticated) {
        const token = localStorage.getItem('token');
        const favResponse = await axios.get(`${API_URL}/favorites/check/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsFavorite(favResponse.data.isFavorite);
      }
    } catch (error) {
      console.error('Failed to fetch product:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleFavorite = async () => {
    if (!isAuthenticated) {
      alert('请先登录');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (isFavorite) {
        await axios.delete(`${API_URL}/favorites/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API_URL}/favorites/${id}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('Favorite action failed:', error);
    }
  };

  const handleContact = () => {
    if (!isAuthenticated) {
      alert('请先登录');
      return;
    }
    navigate(`/chat/${product.userId}?productId=${product.id}`);
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  if (!product) {
    return <div className="empty-state">商品不存在</div>;
  }

  const images = product.images || [];
  const currentImage = images[imageIndex]?.original || '/placeholder.png';

  return (
    <div className="product-detail">
      <div className="product-detail-main">
        <div className="product-images">
          <div className="main-image-container">
            <img
              src={currentImage}
              alt={product.title}
              className="main-image"
              onError={(e) => {
                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23f0f0f0" width="400" height="400"/%3E%3Ctext fill="%23999" font-family="Arial" font-size="14" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3E暂无图片%3C/text%3E%3C/svg%3E';
              }}
            />
            {images.length > 1 && (
              <>
                <button
                  className="image-nav-btn prev"
                  onClick={() => setImageIndex((prev) => (prev - 1 + images.length) % images.length)}
                >
                  ‹
                </button>
                <button
                  className="image-nav-btn next"
                  onClick={() => setImageIndex((prev) => (prev + 1) % images.length)}
                >
                  ›
                </button>
              </>
            )}
          </div>
          {images.length > 1 && (
            <div className="thumbnail-list">
              {images.map((img, idx) => (
                <img
                  key={idx}
                  src={img.thumbnail || img.original}
                  alt={`Thumbnail ${idx}`}
                  className={`thumbnail ${idx === imageIndex ? 'active' : ''}`}
                  onClick={() => setImageIndex(idx)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="product-info">
          <div className="product-header">
            <h1 className="product-title">{product.title}</h1>
            <button
              className={`favorite-btn-large ${isFavorite ? 'active' : ''}`}
              onClick={handleFavorite}
            >
              {isFavorite ? '❤️ 已收藏' : '🤍 收藏'}
            </button>
          </div>

          <div className="product-price-section">
            <span className="price-value">{product.price}</span>
          </div>

          <div className="product-status-row">
            <span className={`status-badge status-${product.status}`}>
              {product.status === 'available' ? '在售' : product.status === 'sold' ? '已售出' : '已下架'}
            </span>
          </div>

          <div className="product-meta-grid">
            <div className="meta-card">
              <div className="meta-icon">📦</div>
              <div className="meta-content">
                <span className="meta-label">商品类别</span>
                <span className="meta-value">{getCategoryName(product.category)}</span>
              </div>
            </div>
            <div className="meta-card">
              <div className="meta-icon">🎯</div>
              <div className="meta-content">
                <span className="meta-label">新旧程度</span>
                <span className="meta-value">{product.condition}</span>
              </div>
            </div>
            <div className="meta-card">
              <div className="meta-icon">👁</div>
              <div className="meta-content">
                <span className="meta-label">浏览次数</span>
                <span className="meta-value">{product.viewCount || 0}</span>
              </div>
            </div>
            <div className="meta-card">
              <div className="meta-icon">📅</div>
              <div className="meta-content">
                <span className="meta-label">发布时间</span>
                <span className="meta-value">
                  {new Date(product.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div className="product-description">
            <h3>商品描述</h3>
            <p>{product.description || '暂无描述'}</p>
          </div>

          <div className="seller-info">
            <h3>卖家信息</h3>
            <div className="seller-details">
              <div className="seller-avatar">
                {product.sellerName?.charAt(0).toUpperCase()}
              </div>
              <div className="seller-text">
                <span className="seller-name">{product.sellerName}</span>
                <span className="seller-phone">{product.sellerPhone || '点击联系查看'}</span>
              </div>
            </div>
          </div>

          {user?.id !== product.userId && (
            <button className="btn btn-primary btn-large" onClick={handleContact}>
              💬 联系卖家
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;