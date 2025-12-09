const express = require('express');
const cors = require('cors');
const { testConnection } = require('./config/database');
require('dotenv').config();

// 禁用代理 - 防止 axios 使用系统代理
process.env.NO_PROXY = '*';
process.env.no_proxy = '*';
delete process.env.HTTP_PROXY;
delete process.env.HTTPS_PROXY;
delete process.env.http_proxy;
delete process.env.https_proxy;

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
// CORS 配置 - 允许所有来源（生产环境建议限制具体域名）
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 请求日志
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// 路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/user'));
app.use('/api/submissions', require('./routes/submission'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/home', require('./routes/home'));
app.use('/api/upload', require('./routes/upload'));

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '服务运行正常',
    timestamp: new Date().toISOString()
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在'
  });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 启动服务器
async function startServer() {
  try {
    // 测试数据库连接
    const dbConnected = await testConnection();

    if (!dbConnected) {
      console.error('❌ 数据库连接失败，服务器启动终止');
      process.exit(1);
    }

    app.listen(PORT, () => {
      console.log('=================================');
      console.log('✅ 服务器启动成功');
      console.log(`📡 端口: ${PORT}`);
      console.log(`🌍 环境: ${process.env.NODE_ENV}`);
      console.log(`🔗 健康检查: http://localhost:${PORT}/api/health`);
      console.log('=================================');
    });

  } catch (error) {
    console.error('启动服务器失败:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
