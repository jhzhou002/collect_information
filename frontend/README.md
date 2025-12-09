# 评论任务信息收集系统 - 后台管理前端

## 技术栈

- Vue 3
- Vite
- Element Plus
- Vue Router
- Pinia
- Axios

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173

### 3. 构建生产版本

```bash
npm run build
```

构建产物将输出到 `dist` 目录

### 4. 预览生产构建

```bash
npm run preview
```

## 功能说明

### 登录
- 默认管理员账号：admin
- 默认密码：admin123

### 数据统计
- 总提交数
- 未结算数量
- 已结算数量
- 总用户数

### 提交记录管理
- 列表展示（昵称、二维码、链接数量、提交时间、结算状态、备注）
- 筛选功能（结算状态、时间范围、用户昵称）
- 查看详情（完整链接列表）
- 更新结算状态（单个/批量）
- 编辑备注
- 导出Excel（二维码图片+链接数量）

## 项目结构

```
frontend/
├── src/
│   ├── api/              # API接口
│   │   ├── auth.js       # 认证相关
│   │   └── admin.js      # 管理员相关
│   ├── router/           # 路由配置
│   │   └── index.js
│   ├── store/            # 状态管理
│   │   └── user.js       # 用户状态
│   ├── utils/            # 工具函数
│   │   └── request.js    # Axios封装
│   ├── views/            # 页面组件
│   │   ├── Login.vue     # 登录页
│   │   ├── Layout.vue    # 布局页
│   │   ├── Dashboard.vue # 数据统计
│   │   └── Submissions.vue # 提交记录
│   ├── App.vue           # 根组件
│   └── main.js           # 入口文件
├── index.html
├── vite.config.js        # Vite配置
└── package.json
```

## 部署说明

### 宝塔部署

1. 构建项目：`npm run build`
2. 将 `dist` 目录上传到服务器（如 `/www/wwwroot/your-domain`）
3. 配置Nginx（见部署文档）

## 注意事项

1. 默认代理后端API到 `/api`
2. 生产环境需要配置Nginx反向代理
3. 导出Excel功能需要后端支持
