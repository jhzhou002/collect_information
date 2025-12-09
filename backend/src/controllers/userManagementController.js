const { pool } = require('../config/database');

/**
 * 获取用户列表（管理端）
 * GET /api/admin/users
 */
exports.getUserList = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, search = '' } = req.query;
    const offset = (page - 1) * pageSize;

    // 构建查询条件
    let whereClause = '';
    let params = [];

    if (search) {
      whereClause = 'WHERE nickname LIKE ? OR openid LIKE ?';
      const searchPattern = `%${search}%`;
      params = [searchPattern, searchPattern];
    }

    // 查询总数
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM users ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // 查询用户列表
    const [users] = await pool.query(
      `SELECT id, openid, nickname, avatar, qrcode_url, created_at
       FROM users
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    );

    res.json({
      success: true,
      data: {
        list: users,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });

  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取用户列表失败',
      error: error.message
    });
  }
};

/**
 * 获取用户详情（管理端）
 * GET /api/admin/users/:id
 */
exports.getUserDetail = async (req, res) => {
  try {
    const userId = req.params.id;

    const [users] = await pool.query(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      data: users[0]
    });

  } catch (error) {
    console.error('获取用户详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取用户详情失败',
      error: error.message
    });
  }
};
