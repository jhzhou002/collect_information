# 图片资源说明

## 需要准备的图片

### 1. TabBar 图标（必需）
放置在 `miniprogram/images/` 目录下：

- **home.png** - 首页图标（未选中状态）
  - 尺寸：81px × 81px
  - 格式：PNG
  - 建议：灰色系图标

- **home-active.png** - 首页图标（选中状态）
  - 尺寸：81px × 81px
  - 格式：PNG
  - 建议：蓝色系图标（#1296db）

- **mine.png** - 我的图标（未选中状态）
  - 尺寸：81px × 81px
  - 格式：PNG
  - 建议：灰色系图标

- **mine-active.png** - 我的图标（选中状态）
  - 尺寸：81px × 81px
  - 格式：PNG
  - 建议：蓝色系图标（#1296db）

### 2. 默认头像（可选）
- **default-avatar.png** - 默认用户头像
  - 尺寸：200px × 200px
  - 格式：PNG
  - 建议：使用通用的头像占位图

### 3. 轮播图（可选）
在 `pages/index/index.js` 中配置实际的轮播图URL：

```javascript
banners: [
  'https://your-domain.com/banner1.jpg',  // 第一张轮播图
  'https://your-domain.com/banner2.jpg',  // 第二张轮播图
  'https://your-domain.com/banner3.jpg'   // 第三张轮播图
]
```

推荐尺寸：750px × 400px

## 快速生成图标

### 方式一：在线生成
使用 iconfont、flaticon 等网站下载图标

### 方式二：使用占位图
临时使用占位图测试：
- https://via.placeholder.com/81x81/999999/ffffff?text=Home
- https://via.placeholder.com/81x81/1296db/ffffff?text=Home

### 方式三：使用Emoji（临时方案）
如果没有图标，可以暂时使用纯色背景：
1. 创建 81×81 的纯色PNG
2. 未选中：灰色 #999999
3. 选中：蓝色 #1296db

## 注意事项

1. **图标大小**：TabBar 图标必须是 81px × 81px
2. **图片格式**：必须是 PNG 格式
3. **文件名**：必须与 app.json 中配置的名称完全一致
4. **路径**：所有图片都放在 `miniprogram/images/` 目录下

## 当前状态

⚠️ **图标文件缺失**

请根据上述说明准备图标文件，否则 tabBar 可能无法正常显示。

临时解决方案：可以注释掉 `app.json` 中的 `iconPath` 和 `selectedIconPath`，只显示文字。
