# 评论任务信息收集系统 - 后端

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env`，并填写配置信息：

```bash
cp .env.example .env
```

**重要配置项：**
- `WX_APPID`: 微信小程序AppID
- `WX_SECRET`: 微信小程序Secret
- `JWT_SECRET`: JWT密钥（生产环境务必修改）

### 3. 初始化数据库

```bash
npm run init-db
```

执行后会创建数据库表并生成默认管理员账号：
- 用户名: `admin`
- 密码: `admin123`

⚠️ **生产环境请立即修改默认密码！**

### 4. 启动服务

开发模式（热重载）：
```bash
npm run dev
```

生产模式：
```bash
npm start
```

服务默认运行在 `http://localhost:3000`

## API文档

### 认证相关

#### 小程序用户登录
```
POST /api/auth/wx-login
Body: {
  "code": "微信登录code",
  "nickname": "用户昵称",
  "avatar": "头像URL"
}
```

#### 管理员登录
```
POST /api/auth/admin-login
Body: {
  "username": "admin",
  "password": "admin123"
}
```

### 用户相关（需要用户Token）

#### 获取用户信息
```
GET /api/user/profile
Headers: { Authorization: "Bearer <token>" }
```

#### 更新二维码
```
POST /api/user/qrcode
Headers: { Authorization: "Bearer <token>" }
Body: {
  "qrcode_url": "七牛云图片URL"
}
```

#### 获取七牛云上传凭证
```
GET /api/user/upload-token
Headers: { Authorization: "Bearer <token>" }
```

### 提交记录相关（需要用户Token）

#### 创建提交记录
```
POST /api/submissions
Headers: { Authorization: "Bearer <token>" }
Body: {
  "nickname": "提交时的昵称",
  "links": ["链接1", "链接2", ...]
}
```

#### 获取提交历史
```
GET /api/submissions/history?page=1&pageSize=10
Headers: { Authorization: "Bearer <token>" }
```

#### 获取提交详情
```
GET /api/submissions/:id
Headers: { Authorization: "Bearer <token>" }
```

### 后台管理相关（需要管理员Token）

#### 获取提交列表
```
GET /api/admin/submissions?page=1&pageSize=20&status=未结算&startTime=2024-01-01&endTime=2024-12-31&nickname=张三
Headers: { Authorization: "Bearer <admin-token>" }
```

#### 获取提交详情
```
GET /api/admin/submissions/:id
Headers: { Authorization: "Bearer <admin-token>" }
```

#### 更新结算状态
```
PUT /api/admin/submissions/:id/status
Headers: { Authorization: "Bearer <admin-token>" }
Body: { "status": "已结算" }
```

#### 批量更新状态
```
PUT /api/admin/submissions/batch-status
Headers: { Authorization: "Bearer <admin-token>" }
Body: {
  "ids": [1, 2, 3],
  "status": "已结算"
}
```

#### 更新备注
```
PUT /api/admin/submissions/:id/remark
Headers: { Authorization: "Bearer <admin-token>" }
Body: { "remark": "备注内容" }
```

#### 导出Excel
```
GET /api/admin/submissions/export?status=未结算
Headers: { Authorization: "Bearer <admin-token>" }
```

#### 统计数据
```
GET /api/admin/statistics
Headers: { Authorization: "Bearer <admin-token>" }
```

## 项目结构

```
backend/
├── src/
│   ├── config/          # 配置文件
│   │   ├── database.js  # 数据库配置
│   │   └── qiniu.js     # 七牛云配置
│   ├── controllers/     # 控制器
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── submissionController.js
│   │   └── adminController.js
│   ├── middleware/      # 中间件
│   │   └── auth.js      # 认证中间件
│   ├── routes/          # 路由
│   │   ├── auth.js
│   │   ├── user.js
│   │   ├── submission.js
│   │   └── admin.js
│   ├── utils/           # 工具函数
│   │   └── urlExtractor.js
│   └── app.js           # 主应用
├── scripts/
│   └── initDatabase.js  # 数据库初始化脚本
├── .env                 # 环境变量
├── .env.example         # 环境变量示例
└── package.json
```

## 部署说明

### 宝塔部署

1. 上传代码到服务器
2. 安装依赖: `npm install --production`
3. 配置 `.env` 文件
4. 初始化数据库: `npm run init-db`
5. 使用PM2启动: `pm2 start src/app.js --name collect-backend`
6. 配置Nginx反向代理（见部署文档）

## 注意事项

1. 生产环境务必修改：
   - JWT_SECRET
   - 管理员密码
   - 数据库密码

2. 七牛云图片为前端直传，后端只提供上传凭证

3. URL自动提取功能会从文本中提取第一个URL

4. Excel导出会下载七牛云图片并嵌入Excel中
