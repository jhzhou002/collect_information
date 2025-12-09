const express = require('express');
const router = express.Router();
const multer = require('multer');
const uploadController = require('../controllers/uploadController');
const { authAdmin } = require('../middleware/auth');

// 配置multer使用内存存储
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 限制5MB
  },
  fileFilter: (req, file, cb) => {
    // 只允许图片
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('只能上传图片文件'));
    }
  }
});

// 获取上传凭证（需要管理员权限）
router.get('/token', authAdmin, uploadController.getUploadToken);

// 上传图片（需要管理员权限）
router.post('/image', authAdmin, upload.single('file'), uploadController.uploadImage);

module.exports = router;
