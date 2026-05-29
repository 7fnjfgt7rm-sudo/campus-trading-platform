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

router.get('/conversations', authenticateToken, (req, res) => {
  try {
    const conversations = db.prepare(`
      SELECT
        CASE WHEN senderId = ? THEN receiverId ELSE senderId END as otherUserId,
        u.username as otherUsername,
        m.message as lastMessage,
        m.timestamp,
        (SELECT COUNT(*) FROM messages
         WHERE senderId = CASE WHEN senderId = ? THEN receiverId ELSE senderId END
         AND receiverId = ? AND read = 0) as unreadCount
      FROM messages m
      JOIN users u ON u.id = CASE WHEN m.senderId = ? THEN m.receiverId ELSE m.senderId END
      WHERE m.id IN (
        SELECT MAX(id) FROM messages
        WHERE senderId = ? OR receiverId = ?
        GROUP BY CASE WHEN senderId < receiverId THEN senderId || '-' || receiverId ELSE receiverId || '-' || senderId END
      )
      ORDER BY m.timestamp DESC
    `).all(req.userId, req.userId, req.userId, req.userId, req.userId, req.userId);

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: '获取会话列表失败' });
  }
});

router.get('/:otherUserId', authenticateToken, (req, res) => {
  try {
    const { otherUserId } = req.params;
    const { productId } = req.query;

    let query = `
      SELECT m.*, u.username as senderName
      FROM messages m
      JOIN users u ON m.senderId = u.id
      WHERE ((m.senderId = ? AND m.receiverId = ?) OR (m.senderId = ? AND m.receiverId = ?))
    `;
    const params = [req.userId, otherUserId, otherUserId, req.userId];

    if (productId) {
      query += ' AND m.productId = ?';
      params.push(productId);
    }

    query += ' ORDER BY m.timestamp ASC';

    const messages = db.prepare(query).all(...params);

    db.prepare(`
      UPDATE messages SET read = 1
      WHERE senderId = ? AND receiverId = ? AND read = 0
    `).run(otherUserId, req.userId);

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: '获取消息记录失败' });
  }
});

router.post('/', authenticateToken, (req, res) => {
  try {
    const { receiverId, message, productId } = req.body;

    if (!receiverId || !message) {
      return res.status(400).json({ error: '收件人和消息内容不能为空' });
    }

    const timestamp = new Date().toISOString();
    const result = db.prepare(`
      INSERT INTO messages (senderId, receiverId, productId, message, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `).run(req.userId, receiverId, productId || null, message, timestamp);

    const newMessage = db.prepare(`
      SELECT m.*, u.username as senderName
      FROM messages m
      JOIN users u ON m.senderId = u.id
      WHERE m.id = ?
    `).get(result.lastInsertRowid);

    res.json(newMessage);
  } catch (error) {
    res.status(500).json({ error: '发送消息失败' });
  }
});

module.exports = router;