const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');
const { authUser } = require('../middleware/auth');

// 公开接口（无需认证，因为可能在登录前就需要记录日志）
router.post('/client', logController.saveClientLog);

module.exports = router;
