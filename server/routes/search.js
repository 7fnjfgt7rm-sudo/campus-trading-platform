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

router.get('/', (req, res) => {
  try {
    const { q, category, minPrice, maxPrice, condition, sort = 'latest', page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT p.*, u.username as sellerName
      FROM products p
      JOIN users u ON p.userId = u.id
      WHERE p.status = 'available'
    `;
    const params = [];

    if (q) {
      query += ' AND (p.title LIKE ? OR p.description LIKE ?)';
      params.push(`%${q}%`, `%${q}%`);
    }
    if (category) {
      query += ' AND p.category = ?';
      params.push(category);
    }
    if (minPrice) {
      query += ' AND p.price >= ?';
      params.push(parseFloat(minPrice));
    }
    if (maxPrice) {
      query += ' AND p.price <= ?';
      params.push(parseFloat(maxPrice));
    }
    if (condition) {
      query += ' AND p.condition = ?';
      params.push(condition);
    }

    switch (sort) {
      case 'price_asc':
        query += ' ORDER BY p.price ASC';
        break;
      case 'price_desc':
        query += ' ORDER BY p.price DESC';
        break;
      case 'popular':
        query += ' ORDER BY p.viewCount DESC';
        break;
      default:
        query += ' ORDER BY p.createdAt DESC';
    }

    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const products = db.prepare(query).all(...params);

    let countQuery = `
      SELECT COUNT(*) as total FROM products p WHERE p.status = 'available'
    `;
    const countParams = [];

    if (q) {
      countQuery += ' AND (p.title LIKE ? OR p.description LIKE ?)';
      countParams.push(`%${q}%`, `%${q}%`);
    }
    if (category) {
      countQuery += ' AND p.category = ?';
      countParams.push(category);
    }
    if (minPrice) {
      countQuery += ' AND p.price >= ?';
      countParams.push(parseFloat(minPrice));
    }
    if (maxPrice) {
      countQuery += ' AND p.price <= ?';
      countParams.push(parseFloat(maxPrice));
    }
    if (condition) {
      countQuery += ' AND p.condition = ?';
      countParams.push(condition);
    }

    const total = db.prepare(countQuery).get(...countParams).total;

    const parsedProducts = products.map(p => ({
      ...p,
      images: JSON.parse(p.images || '[]')
    }));

    res.json({
      products: parsedProducts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: '搜索失败' });
  }
});

router.get('/hot', (req, res) => {
  try {
    const hotProducts = db.prepare(`
      SELECT p.*, u.username as sellerName
      FROM products p
      JOIN users u ON p.userId = u.id
      WHERE p.status = 'available'
      ORDER BY p.viewCount DESC, p.createdAt DESC
      LIMIT 10
    `).all();

    const parsedProducts = hotProducts.map(p => ({
      ...p,
      images: JSON.parse(p.images || '[]')
    }));

    res.json(parsedProducts);
  } catch (error) {
    res.status(500).json({ error: '获取热门商品失败' });
  }
});

router.get('/suggestions', (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.json([]);
    }

    const suggestions = db.prepare(`
      SELECT DISTINCT title FROM products
      WHERE title LIKE ? AND status = 'available'
      ORDER BY viewCount DESC
      LIMIT 5
    `).all(`%${q}%`);

    res.json(suggestions.map(s => s.title));
  } catch (error) {
    res.status(500).json({ error: '获取建议失败' });
  }
});

router.get('/history', authenticateToken, (req, res) => {
  try {
    const history = db.prepare(`
      SELECT DISTINCT keyword, createdAt
      FROM search_history
      WHERE userId = ?
      ORDER BY createdAt DESC
      LIMIT 10
    `).all(req.userId);

    res.json(history);
  } catch (error) {
    res.status(500).json({ error: '获取搜索历史失败' });
  }
});

router.post('/history', authenticateToken, (req, res) => {
  try {
    const { keyword } = req.body;

    if (!keyword) {
      return res.status(400).json({ error: '关键词不能为空' });
    }

    db.prepare('DELETE FROM search_history WHERE userId = ? AND keyword = ?')
      .run(req.userId, keyword);

    db.prepare('INSERT INTO search_history (userId, keyword) VALUES (?, ?)')
      .run(req.userId, keyword);

    res.json({ message: '搜索历史已保存' });
  } catch (error) {
    res.status(500).json({ error: '保存搜索历史失败' });
  }
});

router.delete('/history', authenticateToken, (req, res) => {
  try {
    db.prepare('DELETE FROM search_history WHERE userId = ?').run(req.userId);
    res.json({ message: '搜索历史已清除' });
  } catch (error) {
    res.status(500).json({ error: '清除搜索历史失败' });
  }
});

module.exports = router;