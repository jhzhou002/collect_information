# 管理后台前端

## 已创建的文件

### 页面组件
- `src/views/HomeConfig.vue` - 首页配置管理页面（轮播图和使用说明）

### API接口
- `src/api/admin.js` - 管理后台API接口
- `src/api/request.js` - Axios请求封装

## 需要添加的路由配置

在 `src/router/index.js` 中添加：

```javascript
{
  path: '/home-config',
  name: 'HomeConfig',
  component: () => import('@/views/HomeConfig.vue'),
  meta: { title: '首页配置' }
}
```

## 需要添加的菜单项

在侧边栏菜单中添加：

```javascript
{
  path: '/home-config',
  icon: 'Setting',
  title: '首页配置',
  component: 'HomeConfig'
}
```

## API接口说明

### 首页配置管理

#### 获取所有配置
```
GET /api/admin/home-config
```

#### 添加配置
```
POST /api/admin/home-config
Body: {
  type: 'banner' | 'instruction',
  content: string,
  sort_order: number,
  is_active: 0 | 1
}
```

#### 更新配置
```
PUT /api/admin/home-config/:id
Body: {
  type?: 'banner' | 'instruction',
  content?: string,
  sort_order?: number,
  is_active?: 0 | 1
}
```

#### 删除配置
```
DELETE /api/admin/home-config/:id
```

## 功能说明

### 轮播图管理
- 添加/编辑/删除轮播图
- 支持图片URL配置
- 可设置排序顺序
- 可启用/禁用单个轮播图
- 图片预览功能

### 使用说明管理
- 添加/编辑/删除使用说明
- 支持多行文本输入
- 可设置排序顺序
- 可启用/禁用单条说明

## 数据库表结构

```sql
CREATE TABLE home_config (
  id INT PRIMARY KEY AUTO_INCREMENT,
  type VARCHAR(20) NOT NULL COMMENT '配置类型：banner-轮播图, instruction-使用说明',
  content TEXT NOT NULL COMMENT '内容：轮播图URL或说明文字',
  sort_order INT DEFAULT 0 COMMENT '排序顺序',
  is_active TINYINT(1) DEFAULT 1 COMMENT '是否启用：1-是，0-否',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## 小程序端API

小程序使用以下接口获取首页配置（无需认证）：

```
GET /api/home/config

Response: {
  success: true,
  data: {
    banners: ['url1', 'url2', 'url3'],
    instructions: ['说明1', '说明2', '说明3']
  }
}
```

## 使用步骤

1. **启动后端服务**
   ```bash
   cd backend
   npm run dev
   ```

2. **访问管理页面**
   - 登录管理后台
   - 点击侧边栏"首页配置"菜单

3. **管理轮播图**
   - 点击"添加轮播图"按钮
   - 输入图片URL、设置排序、选择状态
   - 点击"保存"

4. **管理使用说明**
   - 点击"添加说明"按钮
   - 输入说明文字、设置排序、选择状态
   - 点击"保存"

5. **查看小程序效果**
   - 小程序会自动从后端获取最新配置
   - 刷新小程序首页即可看到更新

## 注意事项

1. 轮播图URL必须是HTTPS协议
2. 轮播图建议尺寸：750x400px
3. 排序数字越小越靠前
4. 禁用的配置不会在小程序端显示
5. 删除操作不可恢复，请谨慎操作
