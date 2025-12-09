const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function initDatabase() {
  let connection;

  try {
    // 连接数据库
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306
    });

    console.log('✅ 数据库连接成功');

    // 读取SQL文件并执行
    const fs = require('fs');
    const path = require('path');
    const sqlFile = path.join(__dirname, '../../database/init.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');

    console.log('📝 执行SQL脚本...');

    // 先删除表（按正确顺序）
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query('DROP TABLE IF EXISTS links');
    await connection.query('DROP TABLE IF EXISTS submissions');
    await connection.query('DROP TABLE IF EXISTS users');
    await connection.query('DROP TABLE IF EXISTS admins');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('✅ 旧表已删除');

    // 分割并执行CREATE语句
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt =>
        stmt.length > 0 &&
        !stmt.startsWith('USE') &&
        !stmt.includes('DROP TABLE') &&
        (stmt.includes('CREATE TABLE') || stmt.includes('INSERT INTO'))
      );

    console.log(`📝 准备创建 ${statements.length} 张表...`);

    for (const statement of statements) {
      if (statement.trim()) {
        await connection.query(statement);
      }
    }

    console.log('✅ 数据库表结构创建成功');

    // 生成管理员密码哈希
    const adminPassword = 'admin123'; // 默认密码
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // 删除旧的管理员记录并插入新的
    await connection.query('DELETE FROM admins WHERE username = ?', ['admin']);
    await connection.query(
      'INSERT INTO admins (username, password) VALUES (?, ?)',
      ['admin', hashedPassword]
    );

    console.log('✅ 管理员账号创建成功');
    console.log('==========================================');
    console.log('管理员账号信息:');
    console.log('用户名: admin');
    console.log('密码: admin123');
    console.log('⚠️  请在生产环境中修改默认密码！');
    console.log('==========================================');

  } catch (error) {
    console.error('❌ 初始化数据库失败:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('✅ 数据库连接已关闭');
    }
  }
}

initDatabase();
