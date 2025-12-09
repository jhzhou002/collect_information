# 小程序调试指南

## 📋 问题：点击登录显示"取消授权"

### 可能的原因

1. **用户真的点了"拒绝"按钮**
2. **`wx.getUserProfile` 调用失败**
3. **基础库版本不兼容**
4. **权限配置问题**
5. **⚠️ 最常见：`wx.getUserProfile` 不在用户点击的同步上下文中调用**

### ✅ 已修复的问题

**错误信息：**
```
getUserProfile:fail can only be invoked by user TAP gesture.
```

**原因：**
`wx.getUserProfile` 必须在用户点击事件的**同步执行栈**中调用，不能在异步回调（如 `wx.login` 的 success 回调）中调用。

**解决方案：**
调整调用顺序，先调用 `wx.getUserProfile`（在点击的同步上下文中），再调用 `wx.login`。

```javascript
// ❌ 错误写法：
wx.login({
  success() {
    wx.getUserProfile({...}) // ❌ 在异步回调中，已经脱离点击上下文
  }
})

// ✅ 正确写法：
wx.getUserProfile({  // ✅ 直接在点击事件中调用
  success() {
    wx.login({...})  // 获取用户信息成功后再获取 code
  }
})
```

---

## 🔍 如何查看日志

### 1. 微信开发者工具控制台

打开微信开发者工具 → 调试器 → Console 标签

**现在会看到详细日志：**

```
========== 开始登录流程 ==========
wx.login 成功: {code: "xxx"}
获取到 code: xxx
wx.getUserProfile 成功: {...}
用户信息 - 昵称: xxx 头像: xxx
========== 发起网络请求 ==========
请求地址: http://127.0.0.1:3000/api/auth/wx-login
请求方法: POST
请求参数: {code: "xxx", nickname: "xxx", avatar: "xxx"}
========== 网络请求响应 ==========
状态码: 200
响应数据: {success: true, data: {...}}
✅ 请求成功
Token 已保存: xxx
用户信息已保存: {...}
========== 登录流程完成 ==========
```

### 2. 如果显示"取消授权"

会看到错误日志：

```
❌ wx.getUserProfile 失败: {...}
失败原因: {"errMsg": "getUserProfile:fail auth deny"}
```

---

## 🛠️ 排查步骤

### 步骤1：检查控制台日志

**正常流程：**
```
✅ 开始登录流程
✅ wx.login 成功
✅ 获取到 code
✅ wx.getUserProfile 成功
✅ 发起网络请求
✅ 网络请求响应
✅ 登录流程完成
```

**异常情况：**
```
✅ 开始登录流程
✅ wx.login 成功
✅ 获取到 code
❌ wx.getUserProfile 失败  <-- 问题在这里
```

### 步骤2：查看失败原因

在控制台查找 `❌ wx.getUserProfile 失败` 日志，查看具体错误信息：

| 错误信息 | 原因 | 解决方法 |
|---------|------|---------|
| `auth deny` | 用户点击了"拒绝" | 正常，用户可以拒绝授权 |
| `getUserProfile:fail` | API 调用失败 | 检查基础库版本 |
| `scope unauthorized` | 权限未配置 | 检查小程序配置 |
| 无任何日志 | 函数未执行 | 检查事件绑定 |

### 步骤3：检查基础库版本

在微信开发者工具中：
1. 点击右上角"详情"
2. 查看"调试基础库"版本
3. `wx.getUserProfile` 需要 **2.10.4** 或以上

**如果版本过低：**
```
详情 → 本地设置 → 调试基础库 → 选择 2.10.4 或更高
```

### 步骤4：检查 app.json 配置

确保没有配置过时的权限：

```json
// app.json
{
  "permission": {
    "scope.userLocation": {
      "desc": "你的位置信息将用于小程序位置接口的效果展示"
    }
  }
}
```

**注意：** `wx.getUserProfile` 不需要在 `app.json` 中配置权限。

---

## 🔧 常见问题解决

### 问题1：用户点击"允许"但显示"取消授权"

**可能原因：**
- 基础库版本问题
- 小程序未上传到微信后台
- 真机和模拟器表现不一致

**解决方法：**
```
1. 检查基础库版本 >= 2.10.4
2. 清除缓存重新编译
3. 真机预览测试
```

### 问题2：授权框不弹出

**可能原因：**
- `wx.getUserProfile` 不是由用户操作触发
- 函数绑定错误

**解决方法：**
```
1. 检查 WXML: bindtap="handleLogin"
2. 检查 JS: handleLogin() 函数存在
3. 查看控制台是否有 "开始登录流程" 日志
```

### 问题3：网络请求失败

**日志示例：**
```
❌ 网络请求失败: {errMsg: "request:fail ..."}
```

**解决方法：**
```
1. 检查后端服务是否启动（http://127.0.0.1:3000/api/health）
2. 检查 app.js 中的 apiBase 配置
3. 开发者工具：详情 → 本地设置 → 勾选"不校验合法域名"
```

### 问题4：后端返回错误

**日志示例：**
```
❌ 业务失败: 微信登录失败: invalid code
```

**解决方法：**
```
1. 检查 WX_APPID 和 WX_SECRET 是否正确
2. code 只能使用一次，重新登录
3. 检查后端 .env 配置
```

---

## 📱 真机调试

### 1. 点击"预览"生成二维码
### 2. 手机扫码打开小程序
### 3. 点击右上角"..."→"打开调试"
### 4. 查看 vConsole 日志

**注意：** 真机调试需要：
- 手机和电脑在同一网络
- 或使用远程调试工具

---

## 🎯 测试清单

### 开发者工具测试
- [ ] 清除缓存重新编译
- [ ] 检查基础库版本 >= 2.10.4
- [ ] 点击头像触发登录
- [ ] 查看控制台日志
- [ ] 授权框正确显示
- [ ] 点击"允许"
- [ ] 查看是否显示"登录中..."
- [ ] 查看最终提示（登录成功/失败）
- [ ] 检查用户信息是否更新

### 真机测试
- [ ] 扫码打开小程序
- [ ] 打开调试模式
- [ ] 点击头像登录
- [ ] 授权并查看结果
- [ ] 查看 vConsole 日志

---

## 📊 完整日志示例

### 成功登录的完整日志

```
========== 开始登录流程 ==========
wx.login 成功: {errMsg: "login:ok", code: "0d1..."}
获取到 code: 0d1...
wx.getUserProfile 成功: {errMsg: "getUserProfile:ok", userInfo: {...}}
用户信息 - 昵称: 测试用户 头像: https://...
========== 发起网络请求 ==========
请求地址: http://127.0.0.1:3000/api/auth/wx-login
请求方法: POST
请求参数: {code: "0d1...", nickname: "测试用户", avatar: "https://..."}
请求头: {Content-Type: "application/json", Authorization: "(无)"}
========== 网络请求响应 ==========
状态码: 200
响应数据: {success: true, message: "登录成功", data: {token: "eyJ...", user: {...}}}
✅ 请求成功
后端登录成功: {success: true, data: {...}}
Token 已保存: eyJ...
用户信息已保存: {id: 1, openid: "o...", nickname: "测试用户", ...}
========== 登录流程完成 ==========
```

### 用户取消授权的日志

```
========== 开始登录流程 ==========
wx.login 成功: {errMsg: "login:ok", code: "0d1..."}
获取到 code: 0d1...
❌ wx.getUserProfile 失败: {errMsg: "getUserProfile:fail auth deny"}
失败原因: {"errMsg":"getUserProfile:fail auth deny"}
```

### 网络错误的日志

```
========== 开始登录流程 ==========
wx.login 成功: {errMsg: "login:ok", code: "0d1..."}
获取到 code: 0d1...
wx.getUserProfile 成功: {errMsg: "getUserProfile:ok", userInfo: {...}}
用户信息 - 昵称: 测试用户 头像: https://...
========== 发起网络请求 ==========
请求地址: http://127.0.0.1:3000/api/auth/wx-login
请求方法: POST
请求参数: {code: "0d1...", nickname: "测试用户", avatar: "https://..."}
❌ 网络请求失败: {errMsg: "request:fail timeout"}
错误详情: {"errMsg":"request:fail timeout"}
```

---

## 🚀 快速诊断命令

### 1. 检查后端服务

```bash
# 检查后端是否运行
curl http://127.0.0.1:3000/api/health

# 应该返回
{"success":true,"message":"服务运行正常","timestamp":"..."}
```

### 2. 检查配置文件

```bash
# 检查后端 .env
cat backend/.env | grep WX_

# 应该看到
WX_APPID=wxxxxxxxxxxx
WX_SECRET=xxxxxxxxxxxxxxxx
```

### 3. 检查小程序配置

```javascript
// 检查 miniprogram/app.js
console.log(getApp().globalData.apiBase)
// 应该输出: http://127.0.0.1:3000/api
```

---

## ✅ 解决方案总结

| 问题 | 检查项 | 解决方法 |
|------|--------|---------|
| 显示"取消授权" | 控制台日志 | 查看具体错误原因 |
| 授权框不弹 | 基础库版本 | 升级到 2.10.4+ |
| 网络错误 | 后端服务 | 启动后端/检查地址 |
| 后端错误 | APPID配置 | 检查 .env 配置 |
| 无任何反应 | 事件绑定 | 检查 bindtap |

---

## 📞 获取帮助

如果问题仍未解决：

1. 复制控制台完整日志
2. 截图授权弹窗
3. 说明问题复现步骤
4. 提供基础库版本

这样可以更快定位问题！

---

现在你可以：
1. 打开微信开发者工具
2. 点击"控制台"标签
3. 点击头像登录
4. 查看详细日志
5. 根据日志信息排查问题

所有关键步骤都有日志输出，方便快速定位问题！🔍
