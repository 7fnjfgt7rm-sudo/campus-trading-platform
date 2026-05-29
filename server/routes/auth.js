const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../database');

const JWT_SECRET = 'campus_trading_secret_key_2024';

router.post('/register', (req, res) => {
  const { username, password, phone, studentId } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }

  db.get('SELECT * FROM users WHERE username = ? OR phone = ?', [username, phone], (err, existingUser) => {
    if (err) {
      return res.status(500).json({ error: '注册失败' });
    }
    if (existingUser) {
      return res.status(400).json({ error: '用户名或手机号已存在' });
    }

    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) {
        return res.status(500).json({ error: '注册失败' });
      }

      db.run(
        'INSERT INTO users (username, password, phone, studentId) VALUES (?, ?, ?, ?)',
        [username, hashedPassword, phone || null, studentId || null],
        function(err) {
          if (err) {
            return res.status(500).json({ error: '注册失败' });
          }

          const token = jwt.sign({ userId: this.lastID }, JWT_SECRET, { expiresIn: '7d' });

          res.json({
            message: '注册成功',
            token,
            user: {
              id: this.lastID,
              username,
              phone,
              studentId
            }
          });
        }
      );
    });
  });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  db.get('SELECT * FROM users WHERE username = ? OR phone = ?', [username, username], (err, user) => {
    if (err || !user) {
      return res.status(401).json({ error: '用户不存在' });
    }

    bcrypt.compare(password, user.password, (err, isValid) => {
      if (err || !isValid) {
        return res.status(401).json({ error: '密码错误' });
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

      res.json({
        message: '登录成功',
        token,
        user: {
          id: user.id,
          username: user.username,
          phone: user.phone,
          studentId: user.studentId,
          avatar: user.avatar
        }
      });
    });
  });
});

router.post('/reset-password', (req, res) => {
  const { username, phone, newPassword } = req.body;

  db.get('SELECT * FROM users WHERE username = ? AND phone = ?', [username, phone], (err, user) => {
    if (err || !user) {
      return res.status(404).json({ error: '用户信息不匹配' });
    }

    bcrypt.hash(newPassword, 10, (err, hashedPassword) => {
      if (err) {
        return res.status(500).json({ error: '密码重置失败' });
      }

      db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, user.id], (err) => {
        if (err) {
          return res.status(500).json({ error: '密码重置失败' });
        }
        res.json({ message: '密码重置成功' });
      });
    });
  });
});

router.get('/profile', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: '未授权' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    db.get('SELECT id, username, phone, studentId, email, avatar, createdAt FROM users WHERE id = ?', [decoded.userId], (err, user) => {
      if (err || !user) {
        return res.status(404).json({ error: '用户不存在' });
      }
      res.json(user);
    });
  } catch (error) {
    res.status(401).json({ error: '无效的token' });
  }
});

router.put('/profile', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: '未授权' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const { email, avatar } = req.body;

    db.run('UPDATE users SET email = ?, avatar = ? WHERE id = ?', [email || null, avatar || null, decoded.userId], (err) => {
      if (err) {
        return res.status(500).json({ error: '更新失败' });
      }

      db.get('SELECT id, username, phone, studentId, email, avatar FROM users WHERE id = ?', [decoded.userId], (err, user) => {
        if (err || !user) {
          return res.status(404).json({ error: '用户不存在' });
        }
        res.json({ message: '个人信息更新成功', user });
      });
    });
  } catch (error) {
    res.status(500).json({ error: '更新失败' });
  }
});

module.exports = router;