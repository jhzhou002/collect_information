// pages/mine/mine.js
const app = getApp()
const { wxLogin, getUserProfile } = require('../../api/user')

Page({
  data: {
    isLoggedIn: false,
    userInfo: {}
  },

  onLoad() {
    this.checkLogin()
  },

  onShow() {
    this.checkLogin()
    if (this.data.isLoggedIn) {
      this.loadUserInfo()
    }
  },

  // 检查登录状态
  checkLogin() {
    const token = app.globalData.token
    const userInfo = app.globalData.userInfo || {}

    this.setData({
      isLoggedIn: !!token,
      userInfo: userInfo
    })
  },

  // 加载用户信息
  loadUserInfo() {
    getUserProfile().then(res => {
      const userInfo = res.data
      app.globalData.userInfo = userInfo
      wx.setStorageSync('userInfo', userInfo)

      this.setData({
        userInfo: userInfo
      })
    }).catch(err => {
      console.error('加载用户信息失败:', err)
    })
  },

  // 登录
  handleLogin() {
    const that = this
    console.log('========== 开始登录流程 ==========')

    // 关键修改：先获取用户信息（必须在用户点击的同步上下文中调用）
    // 再获取登录凭证 code
    wx.getUserProfile({
      desc: '用于完善用户信息',
      success(profileRes) {
        console.log('✅ wx.getUserProfile 成功:', profileRes)
        const { nickName, avatarUrl } = profileRes.userInfo
        console.log('用户信息 - 昵称:', nickName, '头像:', avatarUrl)

        // 显示加载提示
        wx.showLoading({ title: '登录中...' })

        // 获取用户信息成功后，再获取 code
        wx.login({
          success(loginRes) {
            console.log('✅ wx.login 成功:', loginRes)
            if (loginRes.code) {
              console.log('获取到 code:', loginRes.code)

              // 调用后端登录接口
              console.log('准备调用后端登录接口，参数:', {
                code: loginRes.code,
                nickname: nickName,
                avatar: avatarUrl
              })

              wxLogin({
                code: loginRes.code,
                nickname: nickName,
                avatar: avatarUrl
              }).then(res => {
                console.log('✅ 后端登录成功:', res)
                wx.hideLoading()
                const { token, user } = res.data

                // 保存token和用户信息
                app.globalData.token = token
                app.globalData.userInfo = user
                wx.setStorageSync('token', token)
                wx.setStorageSync('userInfo', user)
                console.log('Token 已保存:', token)
                console.log('用户信息已保存:', user)

                that.setData({
                  isLoggedIn: true,
                  userInfo: user
                })

                wx.showToast({
                  title: '登录成功',
                  icon: 'success'
                })
                console.log('========== 登录流程完成 ==========')
              }).catch(err => {
                wx.hideLoading()
                console.error('❌ 后端登录失败:', err)
                console.error('错误详情:', JSON.stringify(err))
                wx.showToast({
                  title: '登录失败，请重试',
                  icon: 'none'
                })
              })
            } else {
              wx.hideLoading()
              console.error('❌ wx.login 没有返回 code')
              wx.showToast({
                title: '获取登录凭证失败',
                icon: 'none'
              })
            }
          },
          fail(err) {
            wx.hideLoading()
            console.error('❌ wx.login 失败:', err)
            console.error('失败原因:', JSON.stringify(err))
            wx.showToast({
              title: '登录失败',
              icon: 'none'
            })
          }
        })
      },
      fail(err) {
        console.error('❌ wx.getUserProfile 失败:', err)
        console.error('失败原因:', JSON.stringify(err))
        wx.showToast({
          title: '取消授权',
          icon: 'none',
          duration: 2000
        })
      }
    })
  },

  // 跳转到提交历史
  goToHistory() {
    wx.navigateTo({
      url: '/pages/history/history'
    })
  },

  // 跳转到上传二维码
  goToUploadQrcode() {
    wx.navigateTo({
      url: '/pages/upload-qrcode/upload-qrcode'
    })
  },

  // 退出登录
  handleLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除本地数据
          app.globalData.token = null
          app.globalData.userInfo = null
          wx.removeStorageSync('token')
          wx.removeStorageSync('userInfo')

          this.setData({
            isLoggedIn: false,
            userInfo: {}
          })

          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          })
        }
      }
    })
  }
})
