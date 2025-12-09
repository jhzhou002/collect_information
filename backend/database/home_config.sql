-- 首页配置表
CREATE TABLE IF NOT EXISTS home_config (
  id INT PRIMARY KEY AUTO_INCREMENT,
  type VARCHAR(20) NOT NULL COMMENT '配置类型：banner-轮播图, instruction-使用说明',
  content TEXT NOT NULL COMMENT '内容：轮播图URL或说明文字',
  sort_order INT DEFAULT 0 COMMENT '排序顺序',
  is_active TINYINT(1) DEFAULT 1 COMMENT '是否启用：1-是，0-否',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_type (type),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='首页配置表';

-- 插入默认数据
INSERT INTO home_config (type, content, sort_order) VALUES
('banner', 'https://via.placeholder.com/750x400/667eea/ffffff?text=Banner+1', 1),
('banner', 'https://via.placeholder.com/750x400/764ba2/ffffff?text=Banner+2', 2),
('banner', 'https://via.placeholder.com/750x400/f093fb/ffffff?text=Banner+3', 3),
('instruction', '首次使用请先在"我的"页面登录', 1),
('instruction', '支持自动识别文本中的链接', 2),
('instruction', '每次最多可提交10个链接', 3),
('instruction', '可在"提交历史"查看记录', 4);
