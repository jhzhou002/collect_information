const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// 小程序用户登录
router.post('/wx-login', authController.wxLogin);

// 管理员登录
router.post('/admin-login', authController.adminLogin);

module.exports = router;
