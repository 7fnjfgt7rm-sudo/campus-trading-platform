import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import ProductCard from '../components/ProductCard';
import './Search.css';

import { API_URL } from '../config';

const categories = [
  { id: '', name: '全部' },
  { id: 'electronics', name: '数码电子' },
  { id: 'books', name: '图书教材' },
  { id: 'clothing', name: '服饰鞋包' },
  { id: 'daily', name: '生活用品' },
  { id: 'sports', name: '运动户外' },
  { id: 'beauty', name: '美妆护肤' },
  { id: 'other', name: '其他' }
];

const conditions = [
  { id: '', name: '全部' },
  { id: '全新', name: '全新' },
  { id: '几乎全新', name: '几乎全新' },
  { id: '轻微使用', name: '轻微使用' },
  { id: '明显使用', name: '明显使用' }
];

const sortOptions = [
  { id: 'latest', name: '最新发布' },
  { id: 'price_asc', name: '价格从低到高' },
  { id: 'price_desc', name: '价格从高到低' },
  { id: 'popular', name: '热门商品' }
];

function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [history, setHistory] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    q: searchParams.get('q') || '',
    category: searchParams.get('category') || '',
    condition: '',
    minPrice: '',
    maxPrice: '',
    sort: 'latest'
  });

  useEffect(() => {
    fetchProducts();
    fetchHistory();
  }, [searchParams]);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setFilters(prev => ({ ...prev, q }));
    }
  }, [searchParams]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {};
      const q = searchParams.get('q');
      const category = searchParams.get('category');

      if (q) params.q = q;
      if (category) params.category = category;
      if (filters.condition) params.condition = filters.condition;
      if (filters.minPrice) params.minPrice = filters.minPrice;
      if (filters.maxPrice) params.maxPrice = filters.maxPrice;
      if (filters.sort) params.sort = filters.sort;

      const response = await axios.get(`${API_URL}/search`, { params });
      setProducts(response.data.products);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await axios.get(`${API_URL}/search/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory(response.data);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }
  };

  const handleSearch = async (keyword) => {
    const newParams = new URLSearchParams();
    if (keyword) {
      newParams.set('q', keyword);
      const token = localStorage.getItem('token');
      if (token) {
        await axios.post(`${API_URL}/search/history`, { keyword }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchHistory();
      }
    }
    setSearchParams(newParams);
  };

  const handleInputChange = (e) => {
    setFilters({ ...filters, q: e.target.value });

    if (e.target.value) {
      fetchSuggestions(e.target.value);
    } else {
      setSuggestions([]);
    }
  };

  const fetchSuggestions = async (q) => {
    try {
      const response = await axios.get(`${API_URL}/search/suggestions`, {
        params: { q }
      });
      setSuggestions(response.data);
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      setSuggestions([]);
      handleSearch(filters.q);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
  };

  const applyFilters = () => {
    const newParams = new URLSearchParams();
    if (filters.q) newParams.set('q', filters.q);
    if (filters.category) newParams.set('category', filters.category);
    setSearchParams(newParams);
    setShowFilters(false);
  };

  const clearHistory = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await axios.delete(`${API_URL}/search/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory([]);
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  };

  return (
    <div className="search-page">
      <div className="search-header">
        <div className="search-input-container">
          <input
            type="text"
            value={filters.q}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="搜索商品..."
            className="search-input-large"
          />
          <button
            className="search-btn-large"
            onClick={() => handleSearch(filters.q)}
          >
            🔍
          </button>

          {suggestions.length > 0 && (
            <div className="suggestions-list">
              {suggestions.map((suggestion, idx) => (
                <div
                  key={idx}
                  className="suggestion-item"
                  onClick={() => {
                    setFilters({ ...filters, q: suggestion });
                    setSuggestions([]);
                    handleSearch(suggestion);
                  }}
                >
                  {suggestion}
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          className="filter-toggle-btn"
          onClick={() => setShowFilters(!showFilters)}
        >
          筛选 {showFilters ? '▲' : '▼'}
        </button>
      </div>

      {showFilters && (
        <div className="filters-panel">
          <div className="filter-group">
            <label>类别</label>
            <div className="filter-options">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  className={`filter-chip ${filters.category === cat.id ? 'active' : ''}`}
                  onClick={() => handleFilterChange('category', cat.id)}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <label>新旧程度</label>
            <div className="filter-options">
              {conditions.map(cond => (
                <button
                  key={cond.id}
                  className={`filter-chip ${filters.condition === cond.id ? 'active' : ''}`}
                  onClick={() => handleFilterChange('condition', cond.id)}
                >
                  {cond.name}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <label>价格区间</label>
            <div className="price-range">
              <input
                type="number"
                placeholder="最低价"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                className="price-input"
              />
              <span>-</span>
              <input
                type="number"
                placeholder="最高价"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                className="price-input"
              />
            </div>
          </div>

          <div className="filter-actions">
            <button
              className="btn btn-outline"
              onClick={() => setFilters({ ...filters, condition: '', minPrice: '', maxPrice: '' })}
            >
              重置
            </button>
            <button className="btn btn-primary" onClick={applyFilters}>
              应用筛选
            </button>
          </div>
        </div>
      )}

      <div className="search-content">
        <div className="search-sidebar">
          <div className="sidebar-section">
            <div className="sidebar-header">
              <h3>排序方式</h3>
            </div>
            <div className="sort-options">
              {sortOptions.map(option => (
                <label key={option.id} className="sort-option">
                  <input
                    type="radio"
                    name="sort"
                    checked={filters.sort === option.id}
                    onChange={() => handleFilterChange('sort', option.id)}
                  />
                  {option.name}
                </label>
              ))}
            </div>
          </div>

          {history.length > 0 && (
            <div className="sidebar-section">
              <div className="sidebar-header">
                <h3>搜索历史</h3>
                <button className="clear-history-btn" onClick={clearHistory}>
                  清除
                </button>
              </div>
              <div className="history-list">
                {history.map((item, idx) => (
                  <div
                    key={idx}
                    className="history-item"
                    onClick={() => handleSearch(item.keyword)}
                  >
                    {item.keyword}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="search-results">
          <div className="results-header">
            <span className="results-count">
              {pagination ? `${pagination.total} 个商品` : '加载中...'}
            </span>
          </div>

          {loading ? (
            <div className="loading">加载中...</div>
          ) : products.length === 0 ? (
            <div className="empty-state">
              <p>没有找到相关商品</p>
            </div>
          ) : (
            <div className="products-grid">
              {products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Search;