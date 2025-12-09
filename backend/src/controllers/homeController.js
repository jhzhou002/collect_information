const { pool } = require('../config/database');

/**
 * 获取首页配置（小程序端）
 * GET /api/home/config
 */
exports.getHomeConfig = async (req, res) => {
  try {
    // 获取启用的轮播图
    const [banners] = await pool.query(
      'SELECT content FROM home_config WHERE type = ? AND is_active = 1 ORDER BY sort_order ASC',
      ['banner']
    );

    // 获取启用的使用说明（只取第一条，作为HTML内容）
    const [instructions] = await pool.query(
      'SELECT content FROM home_config WHERE type = ? AND is_active = 1 LIMIT 1',
      ['instruction']
    );

    // 获取启用的通知文本（只取第一条）
    const [notices] = await pool.query(
      'SELECT content FROM home_config WHERE type = ? AND is_active = 1 LIMIT 1',
      ['notice']
    );

    res.json({
      success: true,
      data: {
        banners: banners.map(item => item.content),
        instructionHtml: instructions.length > 0 ? instructions[0].content : '',
        noticeText: notices.length > 0 ? notices[0].content : ''
      }
    });
  } catch (error) {
    console.error('获取首页配置错误:', error);
    res.status(500).json({
      success: false,
      message: '获取首页配置失败',
      error: error.message
    });
  }
};

/**
 * 获取所有首页配置（管理端）
 * GET /api/admin/home-config
 */
exports.getAllConfigs = async (req, res) => {
  try {
    const [configs] = await pool.query(
      'SELECT * FROM home_config ORDER BY type ASC, sort_order ASC'
    );

    res.json({
      success: true,
      data: configs
    });
  } catch (error) {
    console.error('获取首页配置错误:', error);
    res.status(500).json({
      success: false,
      message: '获取配置失败',
      error: error.message
    });
  }
};

/**
 * 添加配置项
 * POST /api/admin/home-config
 */
exports.addConfig = async (req, res) => {
  try {
    const { type, content, sort_order } = req.body;

    if (!type || !content) {
      return res.status(400).json({
        success: false,
        message: '类型和内容不能为空'
      });
    }

    const [result] = await pool.query(
      'INSERT INTO home_config (type, content, sort_order) VALUES (?, ?, ?)',
      [type, content, sort_order || 0]
    );

    res.json({
      success: true,
      message: '添加成功',
      data: {
        id: result.insertId
      }
    });
  } catch (error) {
    console.error('添加配置错误:', error);
    res.status(500).json({
      success: false,
      message: '添加失败',
      error: error.message
    });
  }
};

/**
 * 更新配置项
 * PUT /api/admin/home-config/:id
 */
exports.updateConfig = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, content, sort_order, is_active } = req.body;

    const updates = [];
    const values = [];

    if (type !== undefined) {
      updates.push('type = ?');
      values.push(type);
    }
    if (content !== undefined) {
      updates.push('content = ?');
      values.push(content);
    }
    if (sort_order !== undefined) {
      updates.push('sort_order = ?');
      values.push(sort_order);
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(is_active);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有要更新的字段'
      });
    }

    values.push(id);

    await pool.query(
      `UPDATE home_config SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    res.json({
      success: true,
      message: '更新成功'
    });
  } catch (error) {
    console.error('更新配置错误:', error);
    res.status(500).json({
      success: false,
      message: '更新失败',
      error: error.message
    });
  }
};

/**
 * 删除配置项
 * DELETE /api/admin/home-config/:id
 */
exports.deleteConfig = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query('DELETE FROM home_config WHERE id = ?', [id]);

    res.json({
      success: true,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除配置错误:', error);
    res.status(500).json({
      success: false,
      message: '删除失败',
      error: error.message
    });
  }
};
