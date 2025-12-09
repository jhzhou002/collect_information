const { pool } = require('../config/database');
const ExcelJS = require('exceljs');
const axios = require('axios');

/**
 * 获取提交记录列表（后台管理）
 * GET /api/admin/submissions
 */
exports.getSubmissions = async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      status,
      startTime,
      endTime,
      nickname
    } = req.query;

    const offset = (page - 1) * pageSize;

    // 构建查询条件
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (status && ['未结算', '已结算'].includes(status)) {
      whereClause += ' AND s.status = ?';
      params.push(status);
    }

    if (startTime) {
      whereClause += ' AND s.created_at >= ?';
      params.push(startTime);
    }

    if (endTime) {
      whereClause += ' AND s.created_at <= ?';
      params.push(endTime);
    }

    if (nickname) {
      whereClause += ' AND s.submit_nickname LIKE ?';
      params.push(`%${nickname}%`);
    }

    // 查询总数
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM submissions s ${whereClause}`,
      params
    );

    const total = countResult[0].total;

    // 查询列表数据
    const [submissions] = await pool.query(
      `SELECT
        s.id,
        s.user_id,
        s.submit_nickname,
        s.link_count,
        s.status,
        s.remark,
        s.created_at,
        u.avatar,
        u.qrcode_url
       FROM submissions s
       LEFT JOIN users u ON s.user_id = u.id
       ${whereClause}
       ORDER BY s.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
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
    console.error('获取提交列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取提交列表失败',
      error: error.message
    });
  }
};

/**
 * 获取提交详情（后台管理）
 * GET /api/admin/submissions/:id
 */
exports.getSubmissionDetail = async (req, res) => {
  try {
    const submissionId = req.params.id;

    // 查询提交记录
    const [submissions] = await pool.query(
      `SELECT
        s.*,
        u.avatar,
        u.qrcode_url,
        u.nickname as user_nickname
       FROM submissions s
       LEFT JOIN users u ON s.user_id = u.id
       WHERE s.id = ?`,
      [submissionId]
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
 * 更新结算状态
 * PUT /api/admin/submissions/:id/status
 */
exports.updateStatus = async (req, res) => {
  try {
    const submissionId = req.params.id;
    const { status } = req.body;

    if (!['未结算', '已结算'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: '无效的状态值'
      });
    }

    await pool.query(
      'UPDATE submissions SET status = ? WHERE id = ?',
      [status, submissionId]
    );

    res.json({
      success: true,
      message: '状态更新成功'
    });

  } catch (error) {
    console.error('更新状态错误:', error);
    res.status(500).json({
      success: false,
      message: '更新状态失败',
      error: error.message
    });
  }
};

/**
 * 批量更新结算状态
 * PUT /api/admin/submissions/batch-status
 */
exports.batchUpdateStatus = async (req, res) => {
  try {
    const { ids, status } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'ids必须是非空数组'
      });
    }

    if (!['未结算', '已结算'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: '无效的状态值'
      });
    }

    await pool.query(
      'UPDATE submissions SET status = ? WHERE id IN (?)',
      [status, ids]
    );

    res.json({
      success: true,
      message: '批量更新成功'
    });

  } catch (error) {
    console.error('批量更新状态错误:', error);
    res.status(500).json({
      success: false,
      message: '批量更新失败',
      error: error.message
    });
  }
};

/**
 * 更新备注
 * PUT /api/admin/submissions/:id/remark
 */
exports.updateRemark = async (req, res) => {
  try {
    const submissionId = req.params.id;
    const { remark } = req.body;

    await pool.query(
      'UPDATE submissions SET remark = ? WHERE id = ?',
      [remark || null, submissionId]
    );

    res.json({
      success: true,
      message: '备注更新成功'
    });

  } catch (error) {
    console.error('更新备注错误:', error);
    res.status(500).json({
      success: false,
      message: '更新备注失败',
      error: error.message
    });
  }
};

/**
 * 导出Excel
 * GET /api/admin/submissions/export
 */
exports.exportExcel = async (req, res) => {
  try {
    const { status, startTime, endTime, nickname } = req.query;

    // 构建查询条件
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (status && ['未结算', '已结算'].includes(status)) {
      whereClause += ' AND s.status = ?';
      params.push(status);
    }

    if (startTime) {
      whereClause += ' AND s.created_at >= ?';
      params.push(startTime);
    }

    if (endTime) {
      whereClause += ' AND s.created_at <= ?';
      params.push(endTime);
    }

    if (nickname) {
      whereClause += ' AND s.submit_nickname LIKE ?';
      params.push(`%${nickname}%`);
    }

    // 查询数据
    const [submissions] = await pool.query(
      `SELECT
        s.id,
        s.user_id,
        s.link_count,
        s.status,
        s.remark,
        s.created_at,
        u.nickname,
        u.qrcode_url
       FROM submissions s
       LEFT JOIN users u ON s.user_id = u.id
       ${whereClause}
       ORDER BY s.created_at DESC`,
      params
    );

    // 创建Excel工作簿
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('提交记录');

    // 设置列
    worksheet.columns = [
      { header: '用户ID', key: 'user_id', width: 10 },
      { header: '用户昵称', key: 'nickname', width: 20 },
      { header: '链接数量', key: 'link_count', width: 15 },
      { header: '结算状态', key: 'status', width: 15 },
      { header: '备注', key: 'remark', width: 30 },
      { header: '提交时间', key: 'created_at', width: 20 },
      { header: '用户二维码', key: 'qrcode', width: 30 }
    ];

    // 设置行高
    worksheet.getRow(1).height = 20;

    // 添加数据和图片
    for (let i = 0; i < submissions.length; i++) {
      const submission = submissions[i];
      const rowIndex = i + 2; // 从第2行开始（第1行是表头）

      worksheet.getRow(rowIndex).height = 100;

      // 添加用户ID (A列)
      worksheet.getCell(`A${rowIndex}`).value = submission.user_id;
      worksheet.getCell(`A${rowIndex}`).alignment = {
        vertical: 'middle',
        horizontal: 'center'
      };

      // 添加用户昵称 (B列)
      worksheet.getCell(`B${rowIndex}`).value = submission.nickname || '未设置';
      worksheet.getCell(`B${rowIndex}`).alignment = {
        vertical: 'middle',
        horizontal: 'center'
      };

      // 添加链接数量 (C列)
      worksheet.getCell(`C${rowIndex}`).value = submission.link_count;
      worksheet.getCell(`C${rowIndex}`).alignment = {
        vertical: 'middle',
        horizontal: 'center'
      };

      // 添加结算状态 (D列)
      worksheet.getCell(`D${rowIndex}`).value = submission.status;
      worksheet.getCell(`D${rowIndex}`).alignment = {
        vertical: 'middle',
        horizontal: 'center'
      };

      // 添加备注 (E列)
      worksheet.getCell(`E${rowIndex}`).value = submission.remark || '';
      worksheet.getCell(`E${rowIndex}`).alignment = {
        vertical: 'middle',
        horizontal: 'left'
      };

      // 添加提交时间 (F列)
      const date = new Date(submission.created_at);
      const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
      worksheet.getCell(`F${rowIndex}`).value = formattedDate;
      worksheet.getCell(`F${rowIndex}`).alignment = {
        vertical: 'middle',
        horizontal: 'center'
      };

      // 如果有二维码URL，添加图片 (G列)
      if (submission.qrcode_url) {
        try {
          // 下载图片
          const response = await axios.get(submission.qrcode_url, {
            responseType: 'arraybuffer',
            timeout: 5000
          });

          const imageBuffer = Buffer.from(response.data);

          // 添加图片到工作簿
          const imageId = workbook.addImage({
            buffer: imageBuffer,
            extension: 'png'
          });

          // 将图片添加到单元格 (G列是第6列，索引为6)
          worksheet.addImage(imageId, {
            tl: { col: 6, row: rowIndex - 1 },
            ext: { width: 90, height: 90 },
            editAs: 'oneCell'
          });

        } catch (imgError) {
          console.error(`下载图片失败 (${submission.qrcode_url}):`, imgError.message);
          worksheet.getCell(`G${rowIndex}`).value = '图片加载失败';
        }
      } else {
        worksheet.getCell(`G${rowIndex}`).value = '未上传';
        worksheet.getCell(`G${rowIndex}`).alignment = {
          vertical: 'middle',
          horizontal: 'center'
        };
      }
    }

    // 设置响应头
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=submissions_${Date.now()}.xlsx`
    );

    // 输出Excel文件
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('导出Excel错误:', error);
    res.status(500).json({
      success: false,
      message: '导出失败',
      error: error.message
    });
  }
};

/**
 * 导出HTML
 * GET /api/admin/submissions/export-html
 */
exports.exportHtml = async (req, res) => {
  try {
    const { status, startTime, endTime, nickname } = req.query;

    // 构建查询条件
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (status && ['未结算', '已结算'].includes(status)) {
      whereClause += ' AND s.status = ?';
      params.push(status);
    }

    if (startTime) {
      whereClause += ' AND s.created_at >= ?';
      params.push(startTime);
    }

    if (endTime) {
      whereClause += ' AND s.created_at <= ?';
      params.push(endTime);
    }

    if (nickname) {
      whereClause += ' AND s.submit_nickname LIKE ?';
      params.push(`%${nickname}%`);
    }

    // 查询数据
    const [submissions] = await pool.query(
      `SELECT
        s.id,
        s.user_id,
        s.link_count,
        s.status,
        s.remark,
        s.created_at,
        u.nickname,
        u.qrcode_url
       FROM submissions s
       LEFT JOIN users u ON s.user_id = u.id
       ${whereClause}
       ORDER BY s.created_at DESC`,
      params
    );

    // 生成HTML内容
    let html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>提交记录导出</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: "Microsoft YaHei", Arial, sans-serif;
      padding: 20px;
      background: #f5f5f5;
    }

    .container {
      max-width: 1400px;
      margin: 0 auto;
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    h1 {
      text-align: center;
      color: #333;
      margin-bottom: 10px;
      font-size: 28px;
    }

    .export-info {
      text-align: center;
      color: #666;
      margin-bottom: 30px;
      font-size: 14px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }

    th, td {
      border: 1px solid #ddd;
      padding: 12px;
      text-align: center;
    }

    th {
      background-color: #409EFF;
      color: white;
      font-weight: bold;
      font-size: 14px;
    }

    tr:nth-child(even) {
      background-color: #f9f9f9;
    }

    tr:hover {
      background-color: #f0f7ff;
    }

    .qrcode-img {
      max-width: 100px;
      max-height: 100px;
      cursor: pointer;
      border-radius: 4px;
    }

    .status-settled {
      color: #67C23A;
      font-weight: bold;
    }

    .status-unsettled {
      color: #E6A23C;
      font-weight: bold;
    }

    .no-data {
      text-align: center;
      padding: 40px;
      color: #999;
      font-size: 16px;
    }

    .remark-cell {
      max-width: 300px;
      word-wrap: break-word;
      text-align: left;
    }

    @media print {
      body {
        background: white;
      }

      .container {
        box-shadow: none;
        padding: 0;
      }

      .qrcode-img {
        max-width: 80px;
        max-height: 80px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>提交记录导出</h1>
    <div class="export-info">
      导出时间: ${new Date().toLocaleString('zh-CN')} |
      总记录数: ${submissions.length}
    </div>

    <table>
      <thead>
        <tr>
          <th>用户ID</th>
          <th>用户昵称</th>
          <th>链接数量</th>
          <th>结算状态</th>
          <th>备注</th>
          <th>提交时间</th>
          <th>用户二维码</th>
        </tr>
      </thead>
      <tbody>
`;

    if (submissions.length === 0) {
      html += `
        <tr>
          <td colspan="7" class="no-data">暂无数据</td>
        </tr>
`;
    } else {
      for (const submission of submissions) {
        // 格式化时间
        const date = new Date(submission.created_at);
        const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

        // 状态样式
        const statusClass = submission.status === '已结算' ? 'status-settled' : 'status-unsettled';

        // 二维码显示
        const qrcodeHtml = submission.qrcode_url
          ? `<a href="${submission.qrcode_url}" target="_blank"><img src="${submission.qrcode_url}" alt="二维码" class="qrcode-img" /></a>`
          : '未上传';

        html += `
        <tr>
          <td>${submission.user_id}</td>
          <td>${submission.nickname || '未设置'}</td>
          <td>${submission.link_count}</td>
          <td class="${statusClass}">${submission.status}</td>
          <td class="remark-cell">${submission.remark || '-'}</td>
          <td>${formattedDate}</td>
          <td>${qrcodeHtml}</td>
        </tr>
`;
      }
    }

    html += `
      </tbody>
    </table>
  </div>
</body>
</html>
`;

    // 设置响应头
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=submissions_${Date.now()}.html`
    );

    res.send(html);

  } catch (error) {
    console.error('导出HTML错误:', error);
    res.status(500).json({
      success: false,
      message: '导出失败',
      error: error.message
    });
  }
};

/**
 * 统计数据
 * GET /api/admin/statistics
 */
exports.getStatistics = async (req, res) => {
  try {
    // 总提交数
    const [totalResult] = await pool.query(
      'SELECT COUNT(*) as total FROM submissions'
    );

    // 未结算数
    const [unpaidResult] = await pool.query(
      'SELECT COUNT(*) as total FROM submissions WHERE status = "未结算"'
    );

    // 已结算数
    const [paidResult] = await pool.query(
      'SELECT COUNT(*) as total FROM submissions WHERE status = "已结算"'
    );

    // 总用户数
    const [usersResult] = await pool.query(
      'SELECT COUNT(*) as total FROM users'
    );

    res.json({
      success: true,
      data: {
        totalSubmissions: totalResult[0].total,
        unpaidSubmissions: unpaidResult[0].total,
        paidSubmissions: paidResult[0].total,
        totalUsers: usersResult[0].total
      }
    });

  } catch (error) {
    console.error('获取统计数据错误:', error);
    res.status(500).json({
      success: false,
      message: '获取统计数据失败',
      error: error.message
    });
  }
};
