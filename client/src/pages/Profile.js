import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import './Profile.css';

function Profile() {
  const { user, updateProfile } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    email: user?.email || '',
    avatar: user?.avatar || ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await updateProfile(formData);
      setMessage({ type: 'success', text: '个人信息更新成功' });
    } catch (error) {
      setMessage({ type: 'error', text: '更新失败，请重试' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-avatar">
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          <div className="profile-info">
            <h1>{user?.username}</h1>
            <p className="profile-meta">
              {user?.studentId && <span>学号: {user.studentId}</span>}
              <span>手机: {user?.phone}</span>
            </p>
          </div>
        </div>

        <form className="profile-form" onSubmit={handleSubmit}>
          {message.text && (
            <div className={`message ${message.type}`}>{message.text}</div>
          )}

          <div className="form-section">
            <h3>基本信息</h3>

            <div className="info-row">
              <label>用户名</label>
              <span className="info-value">{user?.username}</span>
            </div>

            <div className="info-row">
              <label>手机号</label>
              <span className="info-value">{user?.phone || '未绑定'}</span>
            </div>

            <div className="info-row">
              <label>学号</label>
              <span className="info-value">{user?.studentId || '未填写'}</span>
            </div>
          </div>

          <div className="form-section">
            <h3>修改信息</h3>

            <div className="form-group">
              <label>邮箱</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input"
                placeholder="请输入邮箱"
              />
            </div>

            <div className="form-group">
              <label>头像URL</label>
              <input
                type="url"
                name="avatar"
                value={formData.avatar}
                onChange={handleChange}
                className="input"
                placeholder="请输入头像图片URL"
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? '保存中...' : '保存修改'}
            </button>
          </div>
        </form>

        <div className="profile-stats">
          <h3>账户统计</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-value">2024</span>
              <span className="stat-label">注册年份</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">0</span>
              <span className="stat-label">已售商品</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">0</span>
              <span className="stat-label">交易成功</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;