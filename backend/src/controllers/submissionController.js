const { pool } = require('../config/database');
const { extractURL } = require('../utils/urlExtractor');

/**
 * 创建提交记录
 * POST /api/submissions
 */
exports.createSubmission = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const userId = req.user.id;
    const { nickname, links } = req.body;

    // 验证参数
    if (!nickname || !links || !Array.isArray(links) || links.length === 0) {
      return res.status(400).json({
        success: false,
        message: '昵称和链接不能为空'
      });
    }

    if (links.length > 10) {
      return res.status(400).json({
        success: false,
        message: '链接数量不能超过10个'
      });
    }

    // 提取并验证URL
    const extractedLinks = links.map(link => extractURL(link)).filter(url => url);

    if (extractedLinks.length === 0) {
      return res.status(400).json({
        success: false,
        message: '至少需要一个有效的链接'
      });
    }

    await connection.beginTransaction();

    // 插入提交记录
    const [result] = await connection.query(
      'INSERT INTO submissions (user_id, submit_nickname, link_count) VALUES (?, ?, ?)',
      [userId, nickname, extractedLinks.length]
    );

    const submissionId = result.insertId;

    // 批量插入链接
    const linkValues = extractedLinks.map((url, index) => [
      submissionId,
      url,
      index + 1
    ]);

    await connection.query(
      'INSERT INTO links (submission_id, url, link_order) VALUES ?',
      [linkValues]
    );

    await connection.commit();

    res.json({
      success: true,
      message: '提交成功',
      data: {
        id: submissionId,
        link_count: extractedLinks.length
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('创建提交记录错误:', error);
    res.status(500).json({
      success: false,
      message: '提交失败',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

/**
 * 获取用户的提交历史
 * GET /api/submissions/history
 */
exports.getHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, pageSize = 10 } = req.query;

    const offset = (page - 1) * pageSize;

    // 查询总数
    const [countResult] = await pool.query(
      'SELECT COUNT(*) as total FROM submissions WHERE user_id = ?',
      [userId]
    );

    const total = countResult[0].total;

    // 查询提交记录
    const [submissions] = await pool.query(
      `SELECT id, submit_nickname, link_count, status, created_at
       FROM submissions
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, parseInt(pageSize), offset]
    );

    res.json({
      success: true,
      data: {
        list: submissions,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });

  } catch (error) {
    console.error('获取提交历史错误:', error);
    res.status(500).json({
      success: false,
      message: '获取提交历史失败',
      error: error.message
    });
  }
};

/**
 * 获取提交详情
 * GET /api/submissions/:id
 */
exports.getDetail = async (req, res) => {
  try {
    const userId = req.user.id;
    const submissionId = req.params.id;

    // 查询提交记录
    const [submissions] = await pool.query(
      'SELECT * FROM submissions WHERE id = ? AND user_id = ?',
      [submissionId, userId]
    );

    if (submissions.length === 0) {
      return res.status(404).json({
        success: false,
        message: '提交记录不存在'
      });
    }

    const submission = submissions[0];

    // 查询链接
    const [links] = await pool.query(
      'SELECT url, link_order FROM links WHERE submission_id = ? ORDER BY link_order',
      [submissionId]
    );

    res.json({
      success: true,
      data: {
        ...submission,
        links: links.map(link => link.url)
      }
    });

  } catch (error) {
    console.error('获取提交详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取提交详情失败',
      error: error.message
    });
  }
};

/**
 * 获取提交详情（详情页专用，返回完整信息）
 * GET /api/submissions/detail/:id
 */
exports.getSubmissionDetail = async (req, res) => {
  try {
    const userId = req.user.id;
    const submissionId = req.params.id;

    // 查询提交记录
    const [submissions] = await pool.query(
      'SELECT * FROM submissions WHERE id = ? AND user_id = ?',
      [submissionId, userId]
    );

    if (submissions.length === 0) {
      return res.status(404).json({
        success: false,
        message: '提交记录不存在'
      });
    }

    const submission = submissions[0];

    // 查询链接（返回完整对象，包含id）
    const [links] = await pool.query(
      'SELECT id, url, link_order FROM links WHERE submission_id = ? ORDER BY link_order',
      [submissionId]
    );

    res.json({
      success: true,
      data: {
        submission: {
          id: submission.id,
          nickname: submission.submit_nickname,
          created_at: submission.created_at,
          is_settled: submission.is_settled,
          remark: submission.remark,
          link_count: submission.link_count
        },
        links: links
      }
    });

  } catch (error) {
    console.error('获取提交详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取提交详情失败',
      error: error.message
    });
  }
};
