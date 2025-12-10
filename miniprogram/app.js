// app.js
App({
  globalData: {
    userInfo: null,
    token: null,
    apiBase: 'http://127.0.0.1:3005/api'
    // apiBase: 'https://collectapi.aihubzone.cn/api' // 替换为实际的API地址
  },

  onLaunch() {
    // 获取本地存储的token
    const token = wx.getStorageSync('token')
    if (token) {
      this.globalData.token = token
    }

    // 获取用户信息
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      this.globalData.userInfo = userInfo
    }
  }
})
