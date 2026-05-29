import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Auth.css';

function ResetPassword() {
  const [formData, setFormData] = useState({
    username: '',
    phone: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.username || !formData.phone || !formData.newPassword) {
      setError('请填写所有必填字段');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('两次密码输入不一致');
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('密码长度至少为6位');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(formData.username, formData.phone, formData.newPassword);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || '密码重置失败');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-container">
        <div className="success-message">
          密码重置成功！正在跳转登录页面...
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <h1>密码重置</h1>
      <form onSubmit={handleSubmit}>
        {error && <div className="error-message">{error}</div>}

        <div className="form-group">
          <label>用户名</label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className="input"
            placeholder="请输入用户名"
          />
        </div>

        <div className="form-group">
          <label>注册手机号</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="input"
            placeholder="请输入注册时的手机号"
          />
        </div>

        <div className="form-group">
          <label>新密码</label>
          <input
            type="password"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
            className="input"
            placeholder="请输入新密码（至少6位）"
          />
        </div>

        <div className="form-group">
          <label>确认新密码</label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="input"
            placeholder="请再次输入新密码"
          />
        </div>

        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? '处理中...' : '重置密码'}
        </button>

        <div className="auth-links">
          <Link to="/login" className="auth-link">
            返回登录
          </Link>
          <Link to="/register" className="auth-link">
            没有账号？立即注册
          </Link>
        </div>
      </form>
    </div>
  );
}

export default ResetPassword;