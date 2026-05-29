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

router.post('/', authenticateToken, (req, res) => {
  try {
    const { title, description, category, price, condition, images } = req.body;

    if (!title || !category || !price || !condition) {
      return res.status(400).json({ error: '请填写必填字段' });
    }

    const result = db.prepare(`
      INSERT INTO products (userId, title, description, category, price, condition, images)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(req.userId, title, description || '', category, price, condition, JSON.stringify(images || []));

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);

    res.json({
      message: '商品发布成功',
      product: { ...product, images: JSON.parse(product.images || '[]') }
    });
  } catch (error) {
    res.status(500).json({ error: '发布失败' });
  }
});

router.get('/', (req, res) => {
  try {
    const { category, minPrice, maxPrice, condition, status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT p.*, u.username as sellerName
      FROM products p
      JOIN users u ON p.userId = u.id
      WHERE 1=1
    `;
    const params = [];

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
    if (status) {
      query += ' AND p.status = ?';
      params.push(status);
    }

    query += ' ORDER BY p.createdAt DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const products = db.prepare(query).all(...params);
    const total = db.prepare('SELECT COUNT(*) as count FROM products').get().count;

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
    res.status(500).json({ error: '获取商品列表失败' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const product = db.prepare(`
      SELECT p.*, u.username as sellerName, u.phone as sellerPhone
      FROM products p
      JOIN users u ON p.userId = u.id
      WHERE p.id = ?
    `).get(req.params.id);

    if (!product) {
      return res.status(404).json({ error: '商品不存在' });
    }

    db.prepare('UPDATE products SET viewCount = viewCount + 1 WHERE id = ?').run(req.params.id);

    res.json({
      ...product,
      images: JSON.parse(product.images || '[]')
    });
  } catch (error) {
    res.status(500).json({ error: '获取商品详情失败' });
  }
});

router.put('/:id', authenticateToken, (req, res) => {
  try {
    const product = db.prepare('SELECT * FROM products WHERE id = ? AND userId = ?')
      .get(req.params.id, req.userId);

    if (!product) {
      return res.status(404).json({ error: '商品不存在或无权修改' });
    }

    const { title, description, category, price, condition, images, status } = req.body;

    db.prepare(`
      UPDATE products
      SET title = ?, description = ?, category = ?, price = ?, condition = ?, images = ?, status = ?
      WHERE id = ?
    `).run(
      title || product.title,
      description || product.description,
      category || product.category,
      price || product.price,
      condition || product.condition,
      images ? JSON.stringify(images) : product.images,
      status || product.status,
      req.params.id
    );

    const updatedProduct = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);

    res.json({
      message: '更新成功',
      product: { ...updatedProduct, images: JSON.parse(updatedProduct.images || '[]') }
    });
  } catch (error) {
    res.status(500).json({ error: '更新失败' });
  }
});

router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const product = db.prepare('SELECT * FROM products WHERE id = ? AND userId = ?')
      .get(req.params.id, req.userId);

    if (!product) {
      return res.status(404).json({ error: '商品不存在或无权删除' });
    }

    db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);

    res.json({ message: '删除成功' });
  } catch (error) {
    res.status(500).json({ error: '删除失败' });
  }
});

router.get('/user/my-products', authenticateToken, (req, res) => {
  try {
    const products = db.prepare(`
      SELECT * FROM products WHERE userId = ? ORDER BY createdAt DESC
    `).all(req.userId);

    const parsedProducts = products.map(p => ({
      ...p,
      images: JSON.parse(p.images || '[]')
    }));

    res.json(parsedProducts);
  } catch (error) {
    res.status(500).json({ error: '获取失败' });
  }
});

module.exports = router;