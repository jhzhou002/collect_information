const { pool } = require('../config/database');

/**
 * 接收前端日志
 * POST /api/log/client
 */
exports.saveClientLog = async (req, res) => {
  try {
    const { level, message, data, timestamp } = req.body;
    const userId = req.user ? req.user.id : null;

    // 打印到服务器控制台
    const logPrefix = `[前端日志 ${level.toUpperCase()}]`;
    console.log('='.repeat(50));
    console.log(logPrefix, new Date(timestamp).toLocaleString());
    console.log('用户ID:', userId);
    console.log('消息:', message);
    if (data) {
      console.log('数据:', typeof data === 'string' ? data : JSON.stringify(data, null, 2));
    }
    console.log('='.repeat(50));

    // 可选：保存到数据库
    // await pool.query(
    //   'INSERT INTO client_logs (user_id, level, message, data, timestamp) VALUES (?, ?, ?, ?, ?)',
    //   [userId, level, message, JSON.stringify(data), new Date(timestamp)]
    // );

    res.json({
      success: true,
      message: '日志已记录'
    });

  } catch (error) {
    console.error('保存前端日志错误:', error);
    res.status(500).json({
      success: false,
      message: '保存日志失败'
    });
  }
};
