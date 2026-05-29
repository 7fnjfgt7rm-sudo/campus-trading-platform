import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ChatContext } from '../context/ChatContext';
import './Navbar.css';

function Navbar() {
  const { user, isAuthenticated, logout } = useContext(AuthContext);
  const { conversations } = useContext(ChatContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();

  const unreadCount = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">🎓</span>
          <span className="brand-text">校园二手</span>
        </Link>

        <form className="navbar-search" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="搜索商品..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="search-btn">
            🔍
          </button>
        </form>

        <div className="navbar-links">
          <Link to="/search" className="nav-link">
            <span className="nav-icon">🛒</span>
            <span className="nav-text">浏览</span>
          </Link>

          {isAuthenticated ? (
            <>
              <Link to="/publish" className="nav-link nav-link-primary">
                <span className="nav-icon">➕</span>
                <span className="nav-text">发布</span>
              </Link>

              <Link to="/chat" className="nav-link">
                <span className="nav-icon">💬</span>
                <span className="nav-text">消息</span>
                {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
              </Link>

              <div className="user-menu-container">
                <button
                  className="user-menu-btn"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  <span className="user-avatar">
                    {user?.username?.charAt(0).toUpperCase()}
                  </span>
                  <span className="user-name">{user?.username}</span>
                </button>

                {showUserMenu && (
                  <div className="user-menu">
                    <Link
                      to="/my-products"
                      className="menu-item"
                      onClick={() => setShowUserMenu(false)}
                    >
                      我的商品
                    </Link>
                    <Link
                      to="/favorites"
                      className="menu-item"
                      onClick={() => setShowUserMenu(false)}
                    >
                      我的收藏
                    </Link>
                    <Link
                      to="/profile"
                      className="menu-item"
                      onClick={() => setShowUserMenu(false)}
                    >
                      个人中心
                    </Link>
                    <div className="menu-divider"></div>
                    <button className="menu-item menu-item-danger" onClick={handleLogout}>
                      退出登录
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">登录</Link>
              <Link to="/register" className="nav-link nav-link-primary">注册</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;