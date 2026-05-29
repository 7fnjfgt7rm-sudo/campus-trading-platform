import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './MyProducts.css';

import { API_URL, IMAGE_BASE_URL } from '../config';

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

const getStatusText = (status) => {
  const statusMap = {
    available: '在售',
    sold: '已售出',
    offline: '已下架'
  };
  return statusMap[status] || '未知';
};

function MyProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetchMyProducts();
  }, []);

  const fetchMyProducts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/products/user/my-products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(response.data || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId) => {
    if (!confirm('确定要删除这个商品吗？')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(products.filter(p => p.id !== productId));
      alert('删除成功');
    } catch (error) {
      console.error('Failed to delete product:', error);
      alert('删除失败');
    }
  };

  const handleStatusChange = async (productId, newStatus) => {
    if (updatingId === productId) return;
    
    setUpdatingId(productId);
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/products/${productId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      setProducts(products.map(p =>
        p.id === productId ? { ...p, status: newStatus } : p
      ));
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('更新失败');
    } finally {
      setUpdatingId(null);
    }
  };

  const getImageUrl = (product) => {
    if (!product.images || product.images.length === 0) {
      return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23f0f0f0" width="100" height="100"/%3E%3Ctext fill="%23999" font-family="Arial" font-size="12" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3E暂无图片%3C/text%3E%3C/svg%3E';
    }
    
    const img = product.images[0];
    const url = img.thumbnail || img.original;
    
    if (url && url.startsWith('http')) {
      return url;
    }
    
    if (url && url.startsWith('/')) {
      return `${IMAGE_BASE_URL}${url}`;
    }
    
    return url || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23f0f0f0" width="100" height="100"/%3E%3Ctext fill="%23999" font-family="Arial" font-size="12" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3E暂无图片%3C/text%3E%3C/svg%3E';
  };

  return (
    <div className="my-products-page">
      <div className="page-header">
        <h1>我的商品</h1>
        <Link to="/publish" className="btn btn-primary">
          发布新商品
        </Link>
      </div>

      {loading ? (
        <div className="loading">加载中...</div>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <p>你还没有发布任何商品</p>
          <Link to="/publish" className="btn btn-primary mt-20">
            发布第一个商品
          </Link>
        </div>
      ) : (
        <div className="products-grid">
          {products.map(product => (
            <div key={product.id} className="product-card">
              <div className="product-image-wrapper">
                <img
                  src={getImageUrl(product)}
                  alt={product.title}
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23f0f0f0" width="100" height="100"/%3E%3Ctext fill="%23999" font-family="Arial" font-size="12" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3E暂无图片%3C/text%3E%3C/svg%3E';
                  }}
                />
                <span className={`product-status-badge status-${product.status || 'offline'}`}>
                  {getStatusText(product.status)}
                </span>
              </div>
              <div className="product-content">
                <Link to={`/product/${product.id}`} className="product-title">
                  {product.title || '未命名商品'}
                </Link>
                <div className="product-price">
                  {product.price !== undefined && product.price !== null 
                    ? product.price.toString() 
                    : '0'}
                </div>
                <span className="product-category-tag">{getCategoryName(product.category)}</span>
                <div className="product-meta-info">
                  <span className="product-views">👁 {product.viewCount || 0}</span>
                </div>
                <div className="product-actions-bar">
                  <select
                    value={product.status || 'offline'}
                    onChange={(e) => handleStatusChange(product.id, e.target.value)}
                    disabled={updatingId === product.id}
                    className="status-select-mini"
                  >
                    <option value="available">在售</option>
                    <option value="sold">已售出</option>
                    <option value="offline">下架</option>
                  </select>
                  <button
                    className="btn-delete-mini"
                    onClick={() => handleDelete(product.id)}
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyProducts;