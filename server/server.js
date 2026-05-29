const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);

const isProduction = process.env.NODE_ENV === 'production';
const VERCEL_URL = process.env.VERCEL_URL;
const BASE_URL = VERCEL_URL ? `https://${VERCEL_URL}` : 'http://localhost:5001';

const corsOrigin = isProduction && VERCEL_URL 
  ? `https://${VERCEL_URL}` 
  : "http://localhost:3000";

const io = new Server(server, {
  cors: { origin: corsOrigin, methods: ["GET", "POST", "PUT", "DELETE"] }
});

app.use(cors({ origin: corsOrigin }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const JWT_SECRET = 'campus_trading_secret_key_2024';

let users = [];
let products = [];
let messages = [];
let favorites = [];
let searchHistory = [];
let nextUserId = 2;
let nextProductId = 1;
let nextMessageId = 1;

const initDemoData = async () => {
  const hashedPassword = await bcrypt.hash('demo123', 10);
  users.push({
    id: 1,
    username: 'demo',
    password: hashedPassword,
    phone: '13800138000',
    studentId: '2021001001',
    email: null,
    avatar: null,
    createdAt: new Date().toISOString()
  });
};

initDemoData();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}.jpg`);
  }
});
const upload = multer({ storage });

function authenticateToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: '未授权' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (e) {
    res.status(401).json({ error: '无效的token' });
  }
}

app.post('/api/auth/register', async (req, res) => {
  const { username, password, phone, studentId } = req.body;
  if (!username || !password) return res.status(400).json({ error: '用户名和密码不能为空' });

  if (users.find(u => u.username === username || u.phone === phone)) {
    return res.status(400).json({ error: '用户名或手机号已存在' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = {
    id: nextUserId++,
    username,
    password: hashedPassword,
    phone,
    studentId,
    email: null,
    avatar: null,
    createdAt: new Date().toISOString()
  };
  users.push(user);

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ message: '注册成功', token, user });
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username || u.phone === username);

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ message: '登录成功', token, user });
});

app.post('/api/auth/reset-password', async (req, res) => {
  const { username, phone, newPassword } = req.body;
  const user = users.find(u => u.username === username && u.phone === phone);

  if (!user) return res.status(404).json({ error: '用户信息不匹配' });

  user.password = await bcrypt.hash(newPassword, 10);
  res.json({ message: '密码重置成功' });
});

app.get('/api/auth/profile', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.userId);
  if (!user) return res.status(404).json({ error: '用户不存在' });
  res.json(user);
});

app.put('/api/auth/profile', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.userId);
  if (!user) return res.status(404).json({ error: '用户不存在' });

  if (req.body.email) user.email = req.body.email;
  if (req.body.avatar) user.avatar = req.body.avatar;
  res.json({ message: '个人信息更新成功', user });
});

app.post('/api/products', authenticateToken, (req, res) => {
  const { title, description, category, price, condition, images } = req.body;
  if (!title || !category || !price || !condition) {
    return res.status(400).json({ error: '请填写必填字段' });
  }

  const product = {
    id: nextProductId++,
    userId: req.userId,
    title,
    description: description || '',
    category,
    price: parseFloat(price),
    condition,
    images: images || [],
    status: 'available',
    viewCount: 0,
    createdAt: new Date().toISOString()
  };
  products.push(product);

  res.json({ message: '商品发布成功', product });
});

app.get('/api/products', (req, res) => {
  const { category, minPrice, maxPrice, condition, status, page = 1, limit = 20 } = req.query;
  let filtered = products;

  if (category) filtered = filtered.filter(p => p.category === category);
  if (minPrice) filtered = filtered.filter(p => p.price >= parseFloat(minPrice));
  if (maxPrice) filtered = filtered.filter(p => p.price <= parseFloat(maxPrice));
  if (condition) filtered = filtered.filter(p => p.condition === condition);
  if (status) filtered = filtered.filter(p => p.status === status);

  filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const offset = (page - 1) * limit;
  const paginated = filtered.slice(offset, offset + parseInt(limit));

  res.json({
    products: paginated.map(p => ({
      ...p,
      sellerName: users.find(u => u.id === p.userId)?.username,
      images: p.images.map(img => ({
        original: img.original.startsWith('http') ? img.original : `${BASE_URL}${img.original}`,
        thumbnail: img.thumbnail.startsWith('http') ? img.thumbnail : `${BASE_URL}${img.thumbnail}`
      }))
    })),
    pagination: { page: parseInt(page), limit: parseInt(limit), total: filtered.length, totalPages: Math.ceil(filtered.length / limit) }
  });
});

app.get('/api/products/:id', (req, res) => {
  const product = products.find(p => p.id === parseInt(req.params.id));
  if (!product) return res.status(404).json({ error: '商品不存在' });

  product.viewCount++;
  const seller = users.find(u => u.id === product.userId);

  res.json({
    ...product,
    sellerName: seller?.username,
    sellerPhone: seller?.phone,
    images: product.images.map(img => ({
      original: img.original.startsWith('http') ? img.original : `${BASE_URL}${img.original}`,
      thumbnail: img.thumbnail.startsWith('http') ? img.thumbnail : `${BASE_URL}${img.thumbnail}`
    }))
  });
});

app.put('/api/products/:id', authenticateToken, (req, res) => {
  const product = products.find(p => p.id === parseInt(req.params.id));
  if (!product || product.userId !== req.userId) {
    return res.status(404).json({ error: '商品不存在或无权修改' });
  }

  Object.assign(product, req.body);
  res.json({ message: '更新成功', product });
});

app.delete('/api/products/:id', authenticateToken, (req, res) => {
  const index = products.findIndex(p => p.id === parseInt(req.params.id));
  if (index === -1 || products[index].userId !== req.userId) {
    return res.status(404).json({ error: '商品不存在或无权删除' });
  }

  products.splice(index, 1);
  res.json({ message: '删除成功' });
});

app.get('/api/products/user/my-products', authenticateToken, (req, res) => {
  const userProducts = products.filter(p => p.userId === req.userId).map(p => ({
    ...p,
    images: p.images.map(img => ({
      original: img.original.startsWith('http') ? img.original : `${BASE_URL}${img.original}`,
      thumbnail: img.thumbnail.startsWith('http') ? img.thumbnail : `${BASE_URL}${img.thumbnail}`
    }))
  }));
  res.json(userProducts);
});

app.get('/api/search', (req, res) => {
  const { q, category, minPrice, maxPrice, condition, sort = 'latest', page = 1, limit = 20 } = req.query;
  let filtered = products.filter(p => p.status === 'available');

  if (q) {
    const query = q.toLowerCase();
    filtered = filtered.filter(p => p.title.toLowerCase().includes(query) || p.description.toLowerCase().includes(query));
  }
  if (category) filtered = filtered.filter(p => p.category === category);
  if (minPrice) filtered = filtered.filter(p => p.price >= parseFloat(minPrice));
  if (maxPrice) filtered = filtered.filter(p => p.price <= parseFloat(maxPrice));
  if (condition) filtered = filtered.filter(p => p.condition === condition);

  switch (sort) {
    case 'price_asc': filtered.sort((a, b) => a.price - b.price); break;
    case 'price_desc': filtered.sort((a, b) => b.price - a.price); break;
    case 'popular': filtered.sort((a, b) => b.viewCount - a.viewCount); break;
    default: filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  const offset = (page - 1) * limit;
  res.json({
    products: filtered.slice(offset, offset + parseInt(limit)).map(p => ({
      ...p,
      sellerName: users.find(u => u.id === p.userId)?.username,
      images: p.images.map(img => ({
        original: img.original.startsWith('http') ? img.original : `${BASE_URL}${img.original}`,
        thumbnail: img.thumbnail.startsWith('http') ? img.thumbnail : `${BASE_URL}${img.thumbnail}`
      }))
    })),
    pagination: { page: parseInt(page), limit: parseInt(limit), total: filtered.length }
  });
});

app.get('/api/search/hot', (req, res) => {
  const hot = [...products]
    .filter(p => p.status === 'available')
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, 10)
    .map(p => ({
      ...p,
      sellerName: users.find(u => u.id === p.userId)?.username,
      images: p.images.map(img => ({
        original: img.original.startsWith('http') ? img.original : `${BASE_URL}${img.original}`,
        thumbnail: img.thumbnail.startsWith('http') ? img.thumbnail : `${BASE_URL}${img.thumbnail}`
      }))
    }));
  res.json(hot);
});

app.get('/api/search/suggestions', (req, res) => {
  const { q } = req.query;
  if (!q) return res.json([]);

  const suggestions = [...new Set(products
    .filter(p => p.title.toLowerCase().includes(q.toLowerCase()) && p.status === 'available')
    .map(p => p.title))].slice(0, 5);
  res.json(suggestions);
});

app.get('/api/search/history', authenticateToken, (req, res) => {
  const history = searchHistory
    .filter(h => h.userId === req.userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 10);
  res.json(history);
});

app.post('/api/search/history', authenticateToken, (req, res) => {
  const { keyword } = req.body;
  searchHistory = searchHistory.filter(h => !(h.userId === req.userId && h.keyword === keyword));
  searchHistory.push({ userId: req.userId, keyword, createdAt: new Date().toISOString() });
  res.json({ message: '搜索历史已保存' });
});

app.delete('/api/search/history', authenticateToken, (req, res) => {
  searchHistory = searchHistory.filter(h => h.userId !== req.userId);
  res.json({ message: '搜索历史已清除' });
});

app.post('/api/upload/images', authenticateToken, upload.array('images', 9), (req, res) => {
  const uploadedImages = req.files.map(f => ({
    original: `${BASE_URL}/uploads/${f.filename}`,
    thumbnail: `${BASE_URL}/uploads/${f.filename}`
  }));
  res.json({ message: '上传成功', images: uploadedImages });
});

app.get('/api/favorites', authenticateToken, (req, res) => {
  const userFavorites = favorites
    .filter(f => f.userId === req.userId)
    .map(f => {
      const product = products.find(p => p.id === f.productId);
      if (!product) return null;
      return {
        ...product,
        favoritedAt: f.createdAt,
        images: product.images.map(img => ({
          original: img.original.startsWith('http') ? img.original : `${BASE_URL}${img.original}`,
          thumbnail: img.thumbnail.startsWith('http') ? img.thumbnail : `${BASE_URL}${img.thumbnail}`
        }))
      };
    })
    .filter(p => p !== null);
  res.json(userFavorites);
});

app.post('/api/favorites/:productId', authenticateToken, (req, res) => {
  const productId = parseInt(req.params.productId);
  if (!products.find(p => p.id === productId)) {
    return res.status(404).json({ error: '商品不存在' });
  }
  if (favorites.find(f => f.userId === req.userId && f.productId === productId)) {
    return res.status(400).json({ error: '已经收藏过该商品' });
  }

  favorites.push({ userId: req.userId, productId, createdAt: new Date().toISOString() });
  res.json({ message: '收藏成功' });
});

app.delete('/api/favorites/:productId', authenticateToken, (req, res) => {
  const productId = parseInt(req.params.productId);
  const index = favorites.findIndex(f => f.userId === req.userId && f.productId === productId);
  if (index !== -1) favorites.splice(index, 1);
  res.json({ message: '取消收藏成功' });
});

app.get('/api/favorites/check/:productId', authenticateToken, (req, res) => {
  const productId = parseInt(req.params.productId);
  const isFavorite = !!favorites.find(f => f.userId === req.userId && f.productId === productId);
  res.json({ isFavorite });
});

app.get('/api/chat/conversations', authenticateToken, (req, res) => {
  const userMessages = messages.filter(m => m.senderId === req.userId || m.receiverId === req.userId);
  const conversationIds = [...new Set(userMessages.map(m => m.senderId === req.userId ? m.receiverId : m.senderId))];

  const conversations = conversationIds.map(id => {
    const otherUser = users.find(u => u.id === id);
    const convMessages = userMessages.filter(m => m.senderId === id || m.receiverId === id);
    const lastMessage = convMessages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

    return {
      otherUserId: id,
      otherUsername: otherUser?.username,
      lastMessage: lastMessage?.message,
      timestamp: lastMessage?.timestamp,
      unreadCount: convMessages.filter(m => m.receiverId === req.userId && !m.read).length
    };
  }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  res.json(conversations);
});

app.get('/api/chat/:otherUserId', authenticateToken, (req, res) => {
  const otherUserId = parseInt(req.params.otherUserId);
  const userMessages = messages.filter(m =>
    (m.senderId === req.userId && m.receiverId === otherUserId) ||
    (m.senderId === otherUserId && m.receiverId === req.userId)
  ).map(m => ({ ...m, senderName: users.find(u => u.id === m.senderId)?.username }));

  userMessages.forEach(m => { if (m.receiverId === req.userId) m.read = true; });
  res.json(userMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)));
});

app.post('/api/chat', authenticateToken, (req, res) => {
  const { receiverId, message, productId } = req.body;
  if (!receiverId || !message) {
    return res.status(400).json({ error: '收件人和消息内容不能为空' });
  }

  const newMessage = {
    id: nextMessageId++,
    senderId: req.userId,
    receiverId: parseInt(receiverId),
    productId: productId ? parseInt(productId) : null,
    message,
    timestamp: new Date().toISOString(),
    read: false
  };
  messages.push(newMessage);

  res.json({ ...newMessage, senderName: users.find(u => u.id === req.userId)?.username });
});

let onlineUsers = new Map();

io.on('connection', (socket) => {
  socket.on('join', (userId) => {
    onlineUsers.set(userId, socket.id);
    socket.userId = userId;
    io.emit('onlineUsers', Array.from(onlineUsers.keys()));
  });

  socket.on('sendMessage', (data) => {
    const { senderId, receiverId, message, productId } = data;
    const receiverSocketId = onlineUsers.get(receiverId.toString());

    const messageData = {
      senderId,
      receiverId,
      message,
      productId,
      timestamp: new Date().toISOString()
    };

    if (receiverSocketId) {
      io.to(receiverSocketId).emit('newMessage', messageData);
    }
    io.to(socket.id).emit('messageSent', messageData);
  });

  socket.on('disconnect', () => {
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      io.emit('onlineUsers', Array.from(onlineUsers.keys()));
    }
  });
});

app.get('/api/online-users', (req, res) => {
  res.json(Array.from(onlineUsers.keys()));
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});