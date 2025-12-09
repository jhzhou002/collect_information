const express = require('express');
const router = express.Router();
const homeController = require('../controllers/homeController');

// 小程序端 - 获取首页配置（无需登录）
router.get('/config', homeController.getHomeConfig);

module.exports = router;
