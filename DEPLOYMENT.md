# 小信册部署文档

## 项目结构
```
小信册/
├── backend/          # Node.js 后端
├── frontend/         # Vue3 管理后台
└── miniprogram/      # 微信小程序
```

## 生产环境配置

### 域名配置
- 后端API: https://collectapi.aihubzone.cn
- 前端管理后台: (根据实际情况配置)

---

## 一、后端部署（Node.js）

### 1. 宝塔面板准备工作

#### 1.1 安装必要软件
在宝塔面板中安装：
- Node.js (推荐 16.x 或 18.x LTS版本)
- PM2 管理器
- Nginx 1.20+
- MySQL 5.7+ 或 8.0+

#### 1.2 创建站点
1. 进入宝塔面板 -> 网站 -> 添加站点
2. 域名填写: `collectapi.aihubzone.cn`
3. 选择纯静态站点即可（后续会配置反向代理）
4. 根目录建议: `/www/wwwroot/collect-api`

### 2. 上传后端代码

#### 2.1 上传文件
将 `backend` 文件夹中的所有文件上传到服务器：
```bash
# 方式1: 使用宝塔面板文件管理器直接上传zip包后解压
# 方式2: 使用FTP工具上传
# 方式3: 使用Git克隆（推荐）
cd /www/wwwroot/collect-api
git clone <your-repo-url> .
```

#### 2.2 安装依赖
在宝塔面板 -> 终端 中执行：
```bash
cd /www/wwwroot/collect-api/backend
npm install --production
```

### 3. 配置环境变量

#### 3.1 复制生产环境配置
```bash
cd /www/wwwroot/collect-api/backend
cp .env.production .env
```

#### 3.2 修改 .env 文件
```bash
vim .env
```

**重要配置项说明：**
```env
# 数据库配置 - 根据生产环境修改
DB_HOST=localhost              # 如果MySQL在同一服务器上，使用localhost
DB_USER=your_db_user          # 数据库用户名
DB_PASSWORD=your_db_password  # 数据库密码
DB_NAME=collect_information   # 数据库名称
DB_PORT=3306

# JWT密钥 - 生产环境必须修改为更安全的密钥
JWT_SECRET=请生成一个强随机密钥

# 七牛云配置 - 保持不变或根据实际情况修改
QINIU_ACCESS_KEY=your_access_key
QINIU_SECRET_KEY=your_secret_key
QINIU_BUCKET=your_bucket_name
QINIU_DOMAIN=https://your-cdn-domain.com

# 微信小程序配置 - 必须配置正确，否则登录会失败！
# 获取方式：登录微信公众平台 https://mp.weixin.qq.com/
# 进入：开发管理 -> 开发设置 -> 开发者ID
# ⚠️ 注意：必须是正式小程序的 AppID，测试号的 AppID 无效
WX_APPID=wxe469358a90ddacb1           # 替换为你的小程序 AppID
WX_SECRET=bb2b45f8b14b1ce1c509776c66acff3f  # 替换为你的小程序 AppSecret

# 服务器配置
PORT=3005
NODE_ENV=production
```

### 4. 数据库初始化

#### 4.1 创建数据库
在宝塔面板 -> 数据库 中：
1. 点击"添加数据库"
2. 数据库名: `collect_information`
3. 用户名: 根据需要设置
4. 密码: 使用强密码

#### 4.2 导入数据库结构
如果有SQL文件，在数据库管理中导入：
```bash
# 或使用命令行
mysql -u your_user -p collect_information < database.sql
```

### 5. 使用PM2启动应用

#### 5.1 创建PM2启动配置
在 `backend` 目录创建 `ecosystem.config.js`：
```javascript
module.exports = {
  apps: [{
    name: 'collect-api',
    script: './src/app.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3005
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
}
```

#### 5.2 启动应用
```bash
cd /www/wwwroot/collect-api/backend

# 创建日志目录
mkdir -p logs

# 启动应用
pm2 start ecosystem.config.js

# 查看状态
pm2 status

# 查看日志
pm2 logs collect-api

# 设置开机自启
pm2 startup
pm2 save
```

#### 5.3 PM2常用命令
```bash
pm2 start collect-api      # 启动
pm2 stop collect-api       # 停止
pm2 restart collect-api    # 重启
pm2 reload collect-api     # 平滑重启
pm2 delete collect-api     # 删除
pm2 logs collect-api       # 查看日志
pm2 monit                  # 监控
```

### 6. 配置Nginx反向代理

#### 6.1 编辑站点配置
在宝塔面板 -> 网站 -> 找到 `collectapi.aihubzone.cn` -> 设置 -> 配置文件

修改配置如下：
```nginx
server {
    listen 80;
    server_name collectapi.aihubzone.cn;

    # 重定向到HTTPS（配置SSL后启用）
    # return 301 https://$server_name$request_uri;

    # 日志
    access_log  /www/wwwroot/collect-api/logs/nginx_access.log;
    error_log   /www/wwwroot/collect-api/logs/nginx_error.log;

    # API反向代理
    location /api {
        proxy_pass http://127.0.0.1:3005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # 文件上传大小限制
        client_max_body_size 10M;
    }

    # 健康检查
    location /api/health {
        proxy_pass http://127.0.0.1:3005/api/health;
    }
}
```

#### 6.2 配置SSL证书（推荐）
1. 在宝塔面板 -> 网站 -> SSL -> Let's Encrypt
2. 申请免费SSL证书
3. 开启强制HTTPS

SSL配置后，Nginx配置会自动更新为：
```nginx
server {
    listen 443 ssl http2;
    server_name collectapi.aihubzone.cn;

    # SSL证书配置（宝塔自动生成）
    ssl_certificate    /path/to/cert.pem;
    ssl_certificate_key    /path/to/key.pem;

    # ... 其他配置同上
}

server {
    listen 80;
    server_name collectapi.aihubzone.cn;
    return 301 https://$server_name$request_uri;
}
```

#### 6.3 重启Nginx
```bash
nginx -t          # 测试配置
nginx -s reload   # 重载配置
```

### 7. 测试后端部署

访问测试：
```bash
# 健康检查
curl https://collectapi.aihubzone.cn/api/health

# 或在浏览器访问
https://collectapi.aihubzone.cn/api/health
```

预期返回：
```json
{
  "success": true,
  "message": "服务运行正常",
  "timestamp": "2024-xx-xx..."
}
```

---

## 二、前端管理后台部署（Vue3）

### 1. 本地构建

#### 1.1 确认生产环境配置
确保 `frontend/.env.production` 文件存在且配置正确：
```env
VITE_API_BASE_URL=https://collectapi.aihubzone.cn/api
```

#### 1.2 构建生产版本
在本地开发机器上执行：
```bash
cd frontend
npm install
npm run build
```

构建完成后，会在 `frontend/dist` 目录生成静态文件。

### 2. 部署到宝塔

#### 2.1 创建站点
1. 宝塔面板 -> 网站 -> 添加站点
2. 域名填写: 你的管理后台域名（如 `admin.yourdomain.com`）
3. 根目录: `/www/wwwroot/collect-admin`
4. PHP版本: 纯静态

#### 2.2 上传构建文件
将 `frontend/dist` 目录下的所有文件上传到：
```
/www/wwwroot/collect-admin/
```

#### 2.3 配置Nginx
```nginx
server {
    listen 80;
    server_name admin.yourdomain.com;  # 修改为实际域名
    root /www/wwwroot/collect-admin;
    index index.html;

    # 日志
    access_log  /www/wwwroot/collect-admin/logs/nginx_access.log;
    error_log   /www/wwwroot/collect-admin/logs/nginx_error.log;

    # Gzip压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # 处理Vue Router的history模式
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # 安全配置
    location ~ /\.(?!well-known) {
        deny all;
    }
}
```

#### 2.4 配置SSL（推荐）
同后端，使用Let's Encrypt申请免费SSL证书。

### 3. 测试前端部署

浏览器访问管理后台域名，测试：
- 页面能否正常加载
- 登录功能是否正常
- API请求是否成功

---

## 三、微信小程序部署

### 1. 配置生产环境API

#### 1.1 修改API基础地址
编辑 `miniprogram/utils/request.js`：
```javascript
const BASE_URL = 'https://collectapi.aihubzone.cn/api'
```

### 2. 配置服务器域名白名单

#### 2.1 登录微信公众平台
1. 访问 https://mp.weixin.qq.com/
2. 登录小程序账号
3. 进入"开发管理" -> "开发设置" -> "服务器域名"

#### 2.2 配置合法域名
添加以下域名到对应类型：

**request合法域名：**
```
https://collectapi.aihubzone.cn
```

**uploadFile合法域名：**
```
https://qiniu.aihubzone.cn
```

**downloadFile合法域名：**
```
https://qiniu.aihubzone.cn
```

### 3. 编译上传小程序

#### 3.1 微信开发者工具
1. 打开微信开发者工具
2. 导入项目 `miniprogram` 目录
3. 点击右上角"上传"
4. 填写版本号和描述
5. 上传到微信服务器

#### 3.2 提交审核
1. 登录微信公众平台
2. 进入"版本管理"
3. 找到刚上传的版本
4. 点击"提交审核"
5. 填写审核信息
6. 等待审核通过后发布

---

## 四、安全配置建议

### 1. 环境变量安全
- 生产环境的 `.env` 文件权限设置为 600
```bash
chmod 600 /www/wwwroot/collect-api/backend/.env
```

### 2. 数据库安全
- 使用强密码
- 不要使用root账户
- 只开放必要的访问权限
- 定期备份数据

### 3. 防火墙配置
在宝塔面板 -> 安全中：
- 只开放 80、443、22(SSH) 端口
- 3005端口（Node.js）不要对外开放，只允许本地访问
- 配置SSH密钥登录

### 4. 定期更新
- 定期更新系统补丁
- 定期更新Node.js依赖
```bash
npm outdated              # 查看过期依赖
npm update               # 更新依赖
npm audit                # 安全审计
npm audit fix            # 自动修复安全问题
```

---

## 五、监控和维护

### 1. PM2监控
```bash
pm2 monit                # 实时监控
pm2 logs collect-api     # 查看日志
pm2 status               # 查看状态
```

### 2. 宝塔监控
在宝塔面板中可以监控：
- CPU使用率
- 内存使用率
- 磁盘使用率
- 网络流量

### 3. 日志管理
定期清理日志文件：
```bash
# 创建日志清理脚本
vim /www/wwwroot/collect-api/clean-logs.sh
```

```bash
#!/bin/bash
# 清理30天前的日志
find /www/wwwroot/collect-api/backend/logs -name "*.log" -mtime +30 -delete
pm2 flush collect-api
```

```bash
chmod +x /www/wwwroot/collect-api/clean-logs.sh

# 添加定时任务（宝塔面板 -> 计划任务）
# 每周日凌晨3点执行
0 3 * * 0 /www/wwwroot/collect-api/clean-logs.sh
```

### 4. 数据库备份
在宝塔面板 -> 计划任务中设置：
- 每天自动备份数据库
- 保留最近7天的备份
- 定期下载备份到本地

---

## 六、常见问题排查

### 1. 后端启动失败
```bash
# 查看PM2日志
pm2 logs collect-api --lines 100

# 常见原因：
# - 端口被占用（检查是否有其他进程占用3005端口）
# - 数据库连接失败（检查.env配置）
# - 依赖安装不完整（重新npm install）
```

### 2. API请求失败
- 检查Nginx配置是否正确
- 检查防火墙规则
- 检查后端服务是否运行
- 查看Nginx错误日志

### 3. 小程序无法访问API
- 检查域名是否已添加到白名单
- 检查域名是否有SSL证书（必须HTTPS）
- 检查后端CORS配置

### 4. 前端页面空白
- 清除浏览器缓存
- 检查控制台错误
- 检查API地址配置是否正确

---

## 七、更新部署流程

### 后端更新
```bash
cd /www/wwwroot/collect-api/backend
git pull                    # 如果使用Git
npm install                # 安装新依赖
pm2 restart collect-api    # 重启应用
```

### 前端更新
```bash
# 本地
cd frontend
npm run build

# 上传新的dist文件到服务器
# 覆盖 /www/wwwroot/collect-admin/ 下的文件
```

### 小程序更新
1. 修改代码
2. 微信开发者工具上传新版本
3. 微信公众平台提交审核
4. 审核通过后发布

---

## 八、联系和支持

部署过程中如遇到问题：
1. 检查相关日志文件
2. 查看本文档的常见问题部分
3. 查看项目GitHub Issues

---

**祝部署顺利！** 🚀
