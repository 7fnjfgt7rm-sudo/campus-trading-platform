const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { db } = require('../database');

const JWT_SECRET = 'campus_trading_secret_key_2024';

function authenticateToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: '未授权' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: '无效的token' });
  }
}

router.get('/', authenticateToken, (req, res) => {
  try {
    const favorites = db.prepare(`
      SELECT f.id, f.createdAt as favoritedAt, p.*
      FROM favorites f
      JOIN products p ON f.productId = p.id
      WHERE f.userId = ?
      ORDER BY f.createdAt DESC
    `).all(req.userId);

    const parsedFavorites = favorites.map(f => ({
      ...f,
      images: JSON.parse(f.images || '[]')
    }));

    res.json(parsedFavorites);
  } catch (error) {
    res.status(500).json({ error: '获取收藏列表失败' });
  }
});

router.post('/:productId', authenticateToken, (req, res) => {
  try {
    const { productId } = req.params;

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
    if (!product) {
      return res.status(404).json({ error: '商品不存在' });
    }

    const existing = db.prepare('SELECT * FROM favorites WHERE userId = ? AND productId = ?')
      .get(req.userId, productId);

    if (existing) {
      return res.status(400).json({ error: '已经收藏过该商品' });
    }

    db.prepare('INSERT INTO favorites (userId, productId) VALUES (?, ?)')
      .run(req.userId, productId);

    res.json({ message: '收藏成功' });
  } catch (error) {
    res.status(500).json({ error: '收藏失败' });
  }
});

router.delete('/:productId', authenticateToken, (req, res) => {
  try {
    const { productId } = req.params;

    db.prepare('DELETE FROM favorites WHERE userId = ? AND productId = ?')
      .run(req.userId, productId);

    res.json({ message: '取消收藏成功' });
  } catch (error) {
    res.status(500).json({ error: '取消收藏失败' });
  }
});

router.get('/check/:productId', authenticateToken, (req, res) => {
  try {
    const { productId } = req.params;

    const favorite = db.prepare('SELECT * FROM favorites WHERE userId = ? AND productId = ?')
      .get(req.userId, productId);

    res.json({ isFavorite: !!favorite });
  } catch (error) {
    res.status(500).json({ error: '检查失败' });
  }
});

module.exports = router;