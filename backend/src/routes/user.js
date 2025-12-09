const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authUser } = require('../middleware/auth');

// 公开接口（无需认证）
router.get('/public-upload-token', userController.getPublicUploadToken);

// 所有路由都需要用户认证
router.use(authUser);

// 获取用户信息
router.get('/profile', userController.getProfile);

// 更新用户信息
router.put('/profile', userController.updateProfile);

// 更新二维码
router.post('/qrcode', userController.updateQrcode);

// 获取七牛云上传凭证
router.get('/upload-token', userController.getUploadToken);

module.exports = router;
