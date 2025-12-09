# 评论任务信息收集系统

一个完整的信息收集系统，包含微信小程序端、后台管理系统和后端API服务。用户可以通过小程序提交评论任务信息，管理员可以在后台查看、筛选、导出数据。

---

## 📋 系统概述

### 功能特性

#### 微信小程序端
- ✅ 微信一键登录
- ✅ 信息提交（昵称 + 链接列表）
- ✅ URL自动提取（类似抖音口令）
- ✅ 动态添加/删除链接（1-10个）
- ✅ 提交历史查看
- ✅ 二维码上传（七牛云直传）
- ✅ 用户信息管理

#### 后台管理系统
- ✅ 管理员登录
- ✅ 数据统计（总提交数、未结算、已结算、用户数）
- ✅ 提交记录列表（分页、筛选）
- ✅ 时间范围筛选（年月日时分）
- ✅ 结算状态管理（单个/批量）
- ✅ 备注编辑
- ✅ Excel导出（二维码图片 + 链接数量）

#### 后端API
- ✅ RESTful API设计
- ✅ JWT认证
- ✅ MySQL数据库
- ✅ 七牛云存储
- ✅ URL自动提取

---

## 🏗️ 技术栈

### 微信小程序
- 原生小程序开发
- WeUI组件库风格

### 后台管理
- Vue 3
- Vite
- Element Plus
- Vue Router
- Pinia
- Axios

### 后端服务
- Node.js
- Express.js
- MySQL 8.0
- JWT
- Bcrypt
- ExcelJS
- 七牛云SDK

---

## 📁 项目结构

```
小信册/
├── backend/               # Node.js后端
│   ├── src/
│   │   ├── config/       # 配置文件
│   │   ├── controllers/  # 控制器
│   │   ├── middleware/   # 中间件
│   │   ├── routes/       # 路由
│   │   └── utils/        # 工具函数
│   ├── scripts/          # 脚本
│   └── package.json
│
├── frontend/             # Vue 3后台管理
│   ├── src/
│   │   ├── api/         # API接口
│   │   ├── components/  # 组件
│   │   ├── router/      # 路由
│   │   ├── store/       # 状态管理
│   │   ├── utils/       # 工具函数
│   │   └── views/       # 页面
│   └── package.json
│
├── miniprogram/         # 微信小程序
│   ├── pages/           # 页面
│   ├── utils/           # 工具函数
│   ├── api/             # API接口
│   ├── app.js
│   ├── app.json
│   └── app.wxss
│
├── database/            # 数据库
│   └── init.sql         # 初始化脚本
│
├── nginx.conf           # Nginx配置
├── DEPLOYMENT.md        # 部署文档
└── README.md            # 本文件
```

---

## 🚀 快速开始

### 1. 环境要求

- Node.js 16+
- MySQL 8.0
- 微信开发者工具
- 宝塔面板（生产环境）

### 2. 数据库配置

```sql
-- 创建数据库
CREATE DATABASE collect_information DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 导入表结构
mysql -u remote -p collect_information < database/init.sql
```

或者使用后端自动初始化：

```bash
cd backend
npm install
npm run init-db
```

### 3. 后端启动

```bash
cd backend
npm install
cp .env.example .env
# 编辑 .env 配置数据库和微信小程序信息
npm run dev  # 开发模式
npm start    # 生产模式
```

访问：http://localhost:3000/api/health

### 4. 前端启动

```bash
cd frontend
npm install
npm run dev
```

访问：http://localhost:5173

默认管理员账号：
- 用户名：`admin`
- 密码：`admin123`

### 5. 小程序启动

1. 使用微信开发者工具打开 `miniprogram` 目录
2. 修改 `app.js` 中的 `apiBase` 为后端地址
3. 编译运行

---

## 📦 生产部署

详细部署文档请参考 [DEPLOYMENT.md](./DEPLOYMENT.md)

### 快速部署步骤

1. **准备服务器**（安装宝塔面板、Nginx、MySQL、Node.js、PM2）
2. **配置数据库**（创建数据库、导入表结构）
3. **部署后端**（上传代码、安装依赖、PM2启动）
4. **部署前端**（本地构建、上传dist目录）
5. **配置Nginx**（反向代理、SSL证书）
6. **配置小程序**（修改AppID、API地址、服务器域名）

### 访问方式

- 后台管理：`https://example.com`
- 后端API：`https://example.com/api`
- 小程序：使用微信扫码

---

## 🗄️ 数据库设计

### users（用户表）
- id: 用户ID
- openid: 微信openid
- nickname: 昵称
- avatar: 头像URL
- qrcode_url: 二维码URL
- created_at: 创建时间

### submissions（提交记录表）
- id: 记录ID
- user_id: 用户ID
- submit_nickname: 提交时的昵称
- link_count: 链接数量
- status: 结算状态（未结算/已结算）
- remark: 备注
- created_at: 提交时间

### links（链接表）
- id: 链接ID
- submission_id: 提交记录ID
- url: 链接地址
- link_order: 排序序号

### admins（管理员表）
- id: 管理员ID
- username: 用户名
- password: 密码（bcrypt加密）
- created_at: 创建时间

---

## 🔧 配置说明

### 后端配置（.env）

```env
# 数据库
DB_HOST=49.235.74.98
DB_USER=remote
DB_PASSWORD=Zhjh0704.
DB_NAME=collect_information

# JWT密钥（生产环境务必修改）
JWT_SECRET=your-secret-key

# 七牛云
QINIU_ACCESS_KEY=nfxmZVGEHjkd8Rsn44S-JSynTBUUguTScil9dDvC
QINIU_SECRET_KEY=9lZjiRtRLL0U_MuYkcUZBAL16TlIJ8_dDSbTqqU2
QINIU_BUCKET=youxuan-images
QINIU_DOMAIN=https://qiniu.aihubzone.cn
QINIU_PATH=collect_information/

# 微信小程序
WX_APPID=your-wx-appid
WX_SECRET=your-wx-secret

# 服务器
PORT=3000
NODE_ENV=production
```

### 小程序配置（app.js）

```javascript
globalData: {
  apiBase: 'https://example.com/api' // 修改为实际API地址
}
```

---

## 📖 API文档

详细API文档请参考 [backend/README.md](./backend/README.md)

### 主要接口

#### 认证相关
- `POST /api/auth/wx-login` - 小程序登录
- `POST /api/auth/admin-login` - 管理员登录

#### 用户相关
- `GET /api/user/profile` - 获取用户信息
- `POST /api/user/qrcode` - 更新二维码
- `GET /api/user/upload-token` - 获取上传凭证

#### 提交记录
- `POST /api/submissions` - 创建提交
- `GET /api/submissions/history` - 提交历史
- `GET /api/submissions/:id` - 提交详情

#### 后台管理
- `GET /api/admin/submissions` - 提交列表
- `PUT /api/admin/submissions/:id/status` - 更新状态
- `PUT /api/admin/submissions/:id/remark` - 更新备注
- `GET /api/admin/submissions/export` - 导出Excel
- `GET /api/admin/statistics` - 统计数据

---

## 🎨 功能截图

### 微信小程序
- 首页：信息提交表单
- 我的：用户信息、二维码预览
- 历史：提交记录列表

### 后台管理
- 登录页：管理员登录
- 数据统计：卡片式数据展示
- 提交记录：表格列表、筛选、导出

---

## ⚠️ 注意事项

### 安全
1. **生产环境务必修改**：
   - JWT_SECRET
   - 管理员密码
   - 数据库密码

2. **微信小程序**：
   - 配置服务器域名白名单
   - 使用HTTPS协议
   - 保护AppSecret

3. **数据库**：
   - 定期备份
   - 限制远程访问
   - 使用强密码

### 性能
1. 启用Nginx Gzip压缩
2. 配置静态资源缓存
3. 使用CDN加速
4. 数据库索引优化

### 维护
1. 定期查看日志
2. 监控服务器资源
3. 及时更新依赖包
4. 做好数据备份

---

## 🐛 常见问题

### 1. 小程序无法登录
- 检查WX_APPID和WX_SECRET是否正确
- 检查服务器域名是否配置
- 确保使用HTTPS

### 2. 图片上传失败
- 检查七牛云配置
- 确保配置了uploadFile域名
- 查看七牛云控制台权限

### 3. 后台无法导出Excel
- 检查后端日志
- 确保有足够的磁盘空间
- 验证图片URL是否可访问

### 4. API 401错误
- Token已过期，重新登录
- 检查请求头Authorization
- 验证JWT_SECRET配置

---

## 📝 开发计划

- [ ] 添加短信通知功能
- [ ] 支持批量导入
- [ ] 数据可视化图表
- [ ] 移动端适配
- [ ] 多角色权限管理

---

## 📄 许可证

MIT License

---

## 👨‍💻 作者

开发于 2024年

---

## 🙏 致谢

- Element Plus
- Vue.js
- Express.js
- 七牛云
- 微信小程序

---

## 📞 技术支持

如有问题，请查看相关文档：
- [后端文档](./backend/README.md)
- [前端文档](./frontend/README.md)
- [小程序文档](./miniprogram/README.md)
- [部署文档](./DEPLOYMENT.md)

祝使用愉快！🎉
