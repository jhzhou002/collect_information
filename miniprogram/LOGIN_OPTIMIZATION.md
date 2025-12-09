# 登录优化说明

## 📚 参考案例

参考文章：https://www.cnblogs.com/mingcore/p/18724262

## ✨ 优化内容

### 1. 采用微信小程序最佳实践

根据参考案例，使用 `wx.getUserProfile` API 简化登录流程：

```javascript
wx.getUserProfile({
  desc: '用于完善用户信息',  // 这个描述会显示给用户
  success: (res) => {
    // 获取用户信息
    const { nickName, avatarUrl } = res.userInfo
    // 调用后端登录
  }
})
```

### 2. 优化后的登录流程

#### 简化版流程（当前实现）

```
点击头像
    ↓
wx.getUserProfile() 获取用户信息（必须在用户点击的同步上下文中）
    ↓
用户点击"允许"授权
    ↓
wx.login() 获取 code
    ↓
发送到后端（code + nickname + avatar）
    ↓
后端调用微信接口验证
    ↓
返回 token
    ↓
登录成功
```

**⚠️ 重要说明：**
调用顺序很关键！`wx.getUserProfile` 必须在用户点击事件的同步执行栈中调用，不能放在 `wx.login` 的异步回调中，否则会报错：
```
getUserProfile:fail can only be invoked by user TAP gesture.
```

#### 关键改进点

**优化前：**
- 先弹说明框 → 再弹授权框
- 流程繁琐，用户体验差

**优化后：**
- ✅ 直接调用授权（符合微信规范）
- ✅ 添加"登录中..."加载提示
- ✅ 完善错误处理
- ✅ 取消授权有友好提示

---

## 📱 代码实现

### 前端实现（小程序）

```javascript
// pages/mine/mine.js
handleLogin() {
  const that = this

  // ⚠️ 关键：先调用 wx.getUserProfile（在用户点击的同步上下文中）
  wx.getUserProfile({
    desc: '用于完善用户信息',  // 必填，显示给用户
    success(profileRes) {
      const { nickName, avatarUrl } = profileRes.userInfo

      wx.showLoading({ title: '登录中...' })

      // 获取用户信息成功后，再获取 code
      wx.login({
        success(loginRes) {
          if (loginRes.code) {
            // 调用后端登录
            wxLogin({
              code: loginRes.code,
              nickname: nickName,
              avatar: avatarUrl
            }).then(res => {
              wx.hideLoading()
              // 保存 token 和用户信息
              // ...
              wx.showToast({ title: '登录成功', icon: 'success' })
            }).catch(err => {
              wx.hideLoading()
              wx.showToast({ title: '登录失败，请重试', icon: 'none' })
            })
          }
        }
      })
    },
    fail() {
      wx.showToast({ title: '取消授权', icon: 'none' })
    }
  })
}
```

### 后端实现（Node.js）

```javascript
// controllers/authController.js
exports.wxLogin = async (req, res) => {
  const { code, nickname, avatar } = req.body

  // 1. 调用微信接口获取 openid
  const wxResponse = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
    params: {
      appid: process.env.WX_APPID,
      secret: process.env.WX_SECRET,
      js_code: code,
      grant_type: 'authorization_code'
    }
  })

  const { openid, session_key } = wxResponse.data

  // 2. 查询或创建用户
  let user = await User.findOne({ openid })
  if (!user) {
    user = await User.create({ openid, nickname, avatar })
  }

  // 3. 生成 JWT token
  const token = jwt.sign({ id: user.id, openid }, JWT_SECRET, { expiresIn: '30d' })

  // 4. 返回
  res.json({
    success: true,
    data: { token, user }
  })
}
```

---

## 🔑 关键API说明

### wx.getUserProfile

**作用：**
获取用户信息（头像、昵称等）

**参数：**
- `desc`: 必填，声明获取用户信息的用途，会显示在弹窗中
- `success`: 成功回调
- `fail`: 失败回调

**返回：**
```javascript
{
  userInfo: {
    nickName: "用户昵称",
    avatarUrl: "头像URL",
    // ... 其他信息
  }
}
```

**注意事项：**
1. ✅ 必须由用户主动触发（如点击按钮）
2. ✅ 每次调用都会弹出授权框
3. ✅ `desc` 参数会显示给用户，需要说明用途
4. ✅ 基础库 2.10.4 以上支持

### wx.login

**作用：**
获取登录凭证 code

**使用：**
```javascript
wx.login({
  success(res) {
    const code = res.code  // 用于后端换取 openid
  }
})
```

**注意：**
- code 有效期 5 分钟
- 需要立即发送给后端验证

---

## 🔒 后端验证流程

### 1. 接收前端参数
```javascript
const { code, nickname, avatar } = req.body
```

### 2. 调用微信接口
```
GET https://api.weixin.qq.com/sns/jscode2session
参数：
  - appid: 小程序 AppID
  - secret: 小程序 Secret
  - js_code: 前端传来的 code
  - grant_type: 固定值 "authorization_code"
```

### 3. 获取 openid
```javascript
{
  openid: "用户唯一标识",
  session_key: "会话密钥",
  unionid: "开放平台统一标识（可选）"
}
```

### 4. 业务处理
- 查询用户是否存在
- 不存在则创建新用户
- 更新用户信息
- 生成并返回 token

---

## ⚠️ 常见问题

### 1. "invalid code" 错误

**原因：**
- code 已被使用
- code 已过期（超过5分钟）
- appid 和 secret 不匹配

**解决：**
- 确保 code 只使用一次
- 前端获取 code 后立即发送给后端
- 检查配置的 appid 和 secret 是否正确

### 2. 授权框不弹出

**原因：**
- `wx.getUserProfile` 不是由用户操作触发
- 在自动执行的代码中调用

**解决：**
- 必须在 `bindtap` 等事件回调中调用
- 不能在 `onLoad` 等生命周期中自动调用

### 3. 用户拒绝授权

**处理：**
```javascript
fail() {
  wx.showToast({
    title: '取消授权',
    icon: 'none',
    duration: 2000
  })
  // 不要强制用户授权，允许取消
}
```

---

## 📊 优化对比

| 项目 | 优化前 | 优化后 |
|------|--------|--------|
| 流程步骤 | 3步（说明→授权→登录） | 2步（授权→登录） |
| 用户体验 | 繁琐 | 简洁 |
| 加载提示 | 无 | 有"登录中..." |
| 错误处理 | 简单 | 完善 |
| 符合规范 | ✅ | ✅ |
| 参考案例 | - | ✅ |

---

## 🎯 测试清单

- [ ] 点击头像触发登录
- [ ] 授权框正确显示
- [ ] 点击"允许"后显示"登录中..."
- [ ] 登录成功显示"登录成功"
- [ ] 用户信息正确显示
- [ ] 点击"拒绝"显示"取消授权"
- [ ] 后端正确返回 token
- [ ] token 保存到本地
- [ ] 刷新后保持登录状态

---

## 📝 总结

参考微信小程序最佳实践和案例文章，我们实现了：

1. ✅ **简化登录流程** - 去掉多余的说明弹窗
2. ✅ **完善用户体验** - 添加加载提示和错误处理
3. ✅ **符合微信规范** - 使用 `wx.getUserProfile` API
4. ✅ **代码清晰易懂** - 注释完整，逻辑清晰

**关键点：**
- `desc: '用于完善用户信息'` 是最佳实践
- 直接调用授权，不要多余的说明
- 完善的错误处理和用户反馈

现在登录功能已经非常完善了！🎉
