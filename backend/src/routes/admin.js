const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const homeController = require('../controllers/homeController');
const userManagementController = require('../controllers/userManagementController');
const { authAdmin } = require('../middleware/auth');

// 所有路由都需要管理员认证
router.use(authAdmin);

// 获取提交记录列表
router.get('/submissions', adminController.getSubmissions);

// 导出Excel（必须在 :id 路由之前）
router.get('/submissions/export', adminController.exportExcel);

// 导出HTML（必须在 :id 路由之前）
router.get('/submissions/export-html', adminController.exportHtml);

// 获取提交详情
router.get('/submissions/:id', adminController.getSubmissionDetail);

// 更新结算状态
router.put('/submissions/:id/status', adminController.updateStatus);

// 批量更新结算状态
router.put('/submissions/batch-status', adminController.batchUpdateStatus);

// 更新备注
router.put('/submissions/:id/remark', adminController.updateRemark);

// 统计数据
router.get('/statistics', adminController.getStatistics);

// 首页配置管理
router.get('/home-config', homeController.getAllConfigs);
router.post('/home-config', homeController.addConfig);
router.put('/home-config/:id', homeController.updateConfig);
router.delete('/home-config/:id', homeController.deleteConfig);

// 用户管理
router.get('/users', userManagementController.getUserList);
router.get('/users/:id', userManagementController.getUserDetail);
router.delete('/users/:id', userManagementController.deleteUser);

module.exports = router;
