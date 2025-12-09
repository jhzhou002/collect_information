const { pool } = require('../config/database');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const axios = require('axios');
require('dotenv').config();

/**
 * 小程序用户登录
 * POST /api/auth/wx-login
 */
exports.wxLogin = async (req, res) => {
  try {
    const { code, nickname, avatar } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: '缺少code参数'
      });
    }

    // 打印配置信息（用于调试）
    console.log('========== 微信登录请求 ==========');
    console.log('Code:', code);
    console.log('APPID:', process.env.WX_APPID);
    console.log('SECRET:', process.env.WX_SECRET ? '已配置' : '未配置');

    // 调用微信接口获取openid
    const wxApiUrl = 'https://api.weixin.qq.com/sns/jscode2session';
    const params = {
      appid: process.env.WX_APPID,
      secret: process.env.WX_SECRET,
      js_code: code,
      grant_type: 'authorization_code'
    };

    console.log('调用微信API:', wxApiUrl);
    console.log('请求参数:', { ...params, secret: '***' });

    // 配置 axios：禁用代理，直连微信API
    const wxResponse = await axios.get(wxApiUrl, {
      params,
      proxy: false,  // 关键：禁用代理
      httpsAgent: new (require('https').Agent)({
        rejectUnauthorized: true
      })
    });

    console.log('微信API响应状态:', wxResponse.status);
    console.log('微信API响应数据:', wxResponse.data);

    const { openid, session_key, errcode, errmsg } = wxResponse.data;

    if (errcode) {
      return res.status(400).json({
        success: false,
        message: `微信登录失败: ${errmsg}`
      });
    }

    // 查询用户是否存在
    const [users] = await pool.query(
      'SELECT * FROM users WHERE openid = ?',
      [openid]
    );

    let user;

    if (users.length === 0) {
      // 新用户，插入数据库
      const [result] = await pool.query(
        'INSERT INTO users (openid, nickname, avatar) VALUES (?, ?, ?)',
        [openid, nickname || null, avatar || null]
      );

      user = {
        id: result.insertId,
        openid,
        nickname: nickname || null,
        avatar: avatar || null,
        qrcode_url: null
      };
    } else {
      // 老用户，更新信息
      user = users[0];

      if (nickname || avatar) {
        await pool.query(
          'UPDATE users SET nickname = ?, avatar = ? WHERE id = ?',
          [nickname || user.nickname, avatar || user.avatar, user.id]
        );

        user.nickname = nickname || user.nickname;
        user.avatar = avatar || user.avatar;
      }
    }

    // 生成JWT token
    const token = jwt.sign(
      {
        id: user.id,
        openid: user.openid,
        role: 'user'
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          nickname: user.nickname,
          avatar: user.avatar,
          qrcode_url: user.qrcode_url
        }
      }
    });

  } catch (error) {
    console.error('微信登录错误:', error);
    res.status(500).json({
      success: false,
      message: '登录失败',
      error: error.message
    });
  }
};

/**
 * 管理员登录
 * POST /api/auth/admin-login
 */
exports.adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名和密码不能为空'
      });
    }

    // 查询管理员
    const [admins] = await pool.query(
      'SELECT * FROM admins WHERE username = ?',
      [username]
    );

    if (admins.length === 0) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    const admin = admins[0];

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    // 生成JWT token
    const token = jwt.sign(
      {
        id: admin.id,
        username: admin.username,
        role: 'admin'
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        admin: {
          id: admin.id,
          username: admin.username
        }
      }
    });

  } catch (error) {
    console.error('管理员登录错误:', error);
    res.status(500).json({
      success: false,
      message: '登录失败',
      error: error.message
    });
  }
};
