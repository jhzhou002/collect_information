-- 评论任务信息收集系统数据库初始化脚本
-- MySQL 8.0

USE collect_information;

-- 删除已存在的表（谨慎使用）
DROP TABLE IF EXISTS links;
DROP TABLE IF EXISTS submissions;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS admins;

-- 1. 用户表
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '用户ID',
  openid VARCHAR(100) UNIQUE NOT NULL COMMENT '微信openid',
  nickname VARCHAR(100) DEFAULT NULL COMMENT '微信昵称',
  avatar VARCHAR(500) DEFAULT NULL COMMENT '头像URL',
  qrcode_url VARCHAR(500) DEFAULT NULL COMMENT '二维码图片URL（七牛云）',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_openid (openid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 2. 提交记录表
CREATE TABLE submissions (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '提交记录ID',
  user_id INT NOT NULL COMMENT '用户ID',
  submit_nickname VARCHAR(100) NOT NULL COMMENT '提交时填写的昵称',
  link_count INT NOT NULL DEFAULT 0 COMMENT '链接数量',
  status ENUM('未结算', '已结算') DEFAULT '未结算' COMMENT '结算状态',
  remark TEXT DEFAULT NULL COMMENT '备注',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '提交时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='提交记录表';

-- 3. 链接表
CREATE TABLE links (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '链接ID',
  submission_id INT NOT NULL COMMENT '提交记录ID',
  url TEXT NOT NULL COMMENT '链接地址',
  link_order INT NOT NULL COMMENT '链接顺序(1-10)',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
  INDEX idx_submission_id (submission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='链接表';

-- 4. 管理员表（后台登录）
CREATE TABLE admins (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '管理员ID',
  username VARCHAR(50) UNIQUE NOT NULL COMMENT '用户名',
  password VARCHAR(255) NOT NULL COMMENT '密码（bcrypt加密）',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='管理员表';

-- 插入默认管理员账号（密码: admin123）
-- 密码使用 bcrypt 加密，实际部署时需要通过后端API或脚本生成
INSERT INTO admins (username, password) VALUES
('admin', '$2b$10$rG3qXJ8vxKZ5YxKZ5YxKZ5YxKZ5YxKZ5YxKZ5YxKZ5YxKZ5YxKZ5Y');
-- 注意：上面的密码哈希是示例，实际使用时需要用 bcrypt 生成真实密码

-- 查看表结构
SHOW TABLES;
