const { pool } = require('../config/database');

/**
 * 获取用户信息
 * GET /api/user/profile
 */
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const [users] = await pool.query(
      'SELECT id, openid, nickname, avatar, qrcode_url, created_at FROM users WHERE id = ?',
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
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      success: false,
      message: '获取用户信息失败',
      error: error.message
    });
  }
};

/**
 * 更新用户信息
 * PUT /api/user/profile
 */
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { nickname, avatar } = req.body;

    const updates = [];
    const values = [];

    if (nickname !== undefined) {
      updates.push('nickname = ?');
      values.push(nickname);
    }

    if (avatar !== undefined) {
      updates.push('avatar = ?');
      values.push(avatar);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有要更新的字段'
      });
    }

    values.push(userId);

    await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // 获取更新后的用户信息
    const [users] = await pool.query(
      'SELECT id, openid, nickname, avatar, qrcode_url FROM users WHERE id = ?',
      [userId]
    );

    res.json({
      success: true,
      message: '更新成功',
      data: users[0]
    });

  } catch (error) {
    console.error('更新用户信息错误:', error);
    res.status(500).json({
      success: false,
      message: '更新失败',
      error: error.message
    });
  }
};

/**
 * 更新二维码
 * POST /api/user/qrcode
 */
exports.updateQrcode = async (req, res) => {
  try {
    const userId = req.user.id;
    const { qrcode_url } = req.body;

    if (!qrcode_url) {
      return res.status(400).json({
        success: false,
        message: '二维码URL不能为空'
      });
    }

    await pool.query(
      'UPDATE users SET qrcode_url = ? WHERE id = ?',
      [qrcode_url, userId]
    );

    res.json({
      success: true,
      message: '二维码更新成功',
      data: { qrcode_url }
    });

  } catch (error) {
    console.error('更新二维码错误:', error);
    res.status(500).json({
      success: false,
      message: '更新二维码失败',
      error: error.message
    });
  }
};

/**
 * 获取七牛云上传凭证
 * GET /api/user/upload-token
 */
exports.getUploadToken = async (req, res) => {
  try {
    const { generateUploadToken } = require('../config/qiniu');
    const tokenData = generateUploadToken();

    res.json({
      success: true,
      data: tokenData
    });

  } catch (error) {
    console.error('获取上传凭证错误:', error);
    res.status(500).json({
      success: false,
      message: '获取上传凭证失败',
      error: error.message
    });
  }
};

/**
 * 获取公开的七牛云上传凭证（无需认证，用于登录流程）
 * GET /api/user/public-upload-token
 */
exports.getPublicUploadToken = async (req, res) => {
  try {
    const { generateUploadToken } = require('../config/qiniu');
    const tokenData = generateUploadToken();

    res.json({
      success: true,
      data: tokenData
    });

  } catch (error) {
    console.error('获取公开上传凭证错误:', error);
    res.status(500).json({
      success: false,
      message: '获取上传凭证失败',
      error: error.message
    });
  }
};
