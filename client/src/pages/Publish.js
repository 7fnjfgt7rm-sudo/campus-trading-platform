import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Publish.css';

import { API_URL } from '../config';

const categories = [
  { id: 'electronics', name: '数码电子' },
  { id: 'books', name: '图书教材' },
  { id: 'clothing', name: '服饰鞋包' },
  { id: 'daily', name: '生活用品' },
  { id: 'sports', name: '运动户外' },
  { id: 'beauty', name: '美妆护肤' },
  { id: 'other', name: '其他' }
];

const conditions = [
  { id: '全新', name: '全新', desc: '从未使用过' },
  { id: '几乎全新', name: '几乎全新', desc: '使用过一两次' },
  { id: '轻微使用', name: '轻微使用', desc: '有轻微使用痕迹' },
  { id: '明显使用', name: '明显使用', desc: '有明显使用痕迹' },
  { id: '老化损坏', name: '老化损坏', desc: '有明显损坏' }
];

function Publish() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    price: '',
    condition: ''
  });
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError('');
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 9) {
      alert('最多只能上传9张图片');
      return;
    }

    const newPreviews = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));

    setPreviews([...previews, ...newPreviews]);
  };

  const handleImageUpload = async () => {
    if (previews.length === 0) return [];

    setUploading(true);
    try {
      const formDataUpload = new FormData();
      previews.forEach(p => formDataUpload.append('images', p.file));

      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/upload/images`, formDataUpload, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      return response.data.images;
    } catch (error) {
      console.error('Upload failed:', error);
      throw new Error('图片上传失败');
    } finally {
      setUploading(false);
    }
  };

  const removePreview = (index) => {
    const newPreviews = [...previews];
    URL.revokeObjectURL(newPreviews[index].preview);
    newPreviews.splice(index, 1);
    setPreviews(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title || !formData.category || !formData.price || !formData.condition) {
      setError('请填写所有必填字段');
      return;
    }

    if (!previews.length) {
      setError('请至少上传一张图片');
      return;
    }

    setLoading(true);
    try {
      const uploadedImages = await handleImageUpload();

      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/products`,
        {
          ...formData,
          price: parseFloat(formData.price),
          images: uploadedImages
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      alert('发布成功！');
      navigate(`/product/${response.data.product.id}`);
    } catch (err) {
      setError(err.message || '发布失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="publish-page">
      <div className="page-header">
        <h1>发布商品</h1>
        <p>填写商品信息，让更多同学看到你的宝贝</p>
      </div>

      <form className="publish-form" onSubmit={handleSubmit}>
        {error && <div className="error-message">{error}</div>}

        <div className="form-section">
          <h3>商品图片</h3>
          <p className="section-hint">最多上传9张图片，第一张将作为封面</p>

          <div className="image-upload-area">
            <div className="image-preview-list">
              {previews.map((preview, index) => (
                <div key={index} className="image-preview">
                  <img src={preview.preview} alt={`Preview ${index}`} />
                  <button
                    type="button"
                    className="remove-image-btn"
                    onClick={() => removePreview(index)}
                  >
                    ×
                  </button>
                </div>
              ))}
              {previews.length < 9 && (
                <button
                  type="button"
                  className="add-image-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <span className="add-icon">+</span>
                  <span>添加图片</span>
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              style={{ display: 'none' }}
            />
          </div>
        </div>

        <div className="form-section">
          <h3>基本信息</h3>

          <div className="form-group">
            <label>商品标题 <span className="required">*</span></label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="input"
              placeholder="例如：iPhone 13 Pro Max 256G"
              maxLength={50}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>商品类别 <span className="required">*</span></label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="select"
              >
                <option value="">选择类别</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>新旧程度 <span className="required">*</span></label>
              <select
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                className="select"
              >
                <option value="">选择新旧程度</option>
                {conditions.map(cond => (
                  <option key={cond.id} value={cond.id}>{cond.name} - {cond.desc}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>商品价格 <span className="required">*</span></label>
            <div className="price-input-wrapper">
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="input price-input"
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>商品描述</h3>
          <div className="form-group">
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="textarea"
              placeholder="详细描述商品的状况、使用时间、转手原因等信息，可以帮助买家更好地了解商品..."
              rows={6}
              maxLength={500}
            />
            <div className="char-count">{formData.description.length}/500</div>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => navigate(-1)}
          >
            取消
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || uploading}
          >
            {loading || uploading ? '发布中...' : '发布商品'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default Publish;