const express = require('express');
const router = express.Router();
const submissionController = require('../controllers/submissionController');
const { authUser } = require('../middleware/auth');

// 所有路由都需要用户认证
router.use(authUser);

// 创建提交记录
router.post('/', submissionController.createSubmission);

// 获取用户的提交历史
router.get('/history', submissionController.getHistory);

// 获取提交详情（详情页专用）
router.get('/detail/:id', submissionController.getSubmissionDetail);

// 获取提交详情（简略版）
router.get('/:id', submissionController.getDetail);

module.exports = router;
