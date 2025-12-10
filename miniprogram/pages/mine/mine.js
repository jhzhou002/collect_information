// pages/mine/mine.js
const app = getApp()
const { wxLogin, getUserProfile } = require('../../api/user')

Page({
  data: {
    isLoggedIn: false,
    userInfo: {},
    showProfileModal: false,
    tempAvatar: '',
    tempNickname: '',
    useWxAvatar: true,
    useWxNickname: true,
    wxAvatarUrl: '',
    wxNickname: ''
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

  // 开始登录流程
  handleLogin() {
    const that = this
    console.log('========== 开始登录流程 ==========')

    wx.showLoading({ title: '登录中...' })

    // 先调用微信登录检查用户是否存在
    wx.login({
      success(loginRes) {
        if (!loginRes.code) {
          wx.hideLoading()
          wx.showToast({
            title: '获取登录凭证失败',
            icon: 'none'
          })
          return
        }

        console.log('获取到 code:', loginRes.code)

        // 先尝试登录，看看是否是老用户
        wxLogin({
          code: loginRes.code
        }).then(res => {
          console.log('✅ 后端登录成功:', res)
          wx.hideLoading()
          const { token, user } = res.data

          // 保存token和用户信息
          app.globalData.token = token
          app.globalData.userInfo = user
          wx.setStorageSync('token', token)
          wx.setStorageSync('userInfo', user)

          that.setData({
            isLoggedIn: true,
            userInfo: user
          })

          // 判断是否是新用户（没有昵称和头像）
          if (!user.nickname || !user.avatar) {
            console.log('新用户，显示完善资料弹窗')
            // 新用户，显示完善资料弹窗
            that.setData({
              showProfileModal: true,
              tempNickname: '',
              tempAvatar: '',
              wxAvatarUrl: '',
              wxNickname: '',
              useWxAvatar: true,
              useWxNickname: true
            })
          } else {
            console.log('老用户，直接登录成功')
            // 老用户，直接登录成功
            wx.showToast({
              title: '登录成功',
              icon: 'success'
            })
          }

        }).catch(err => {
          wx.hideLoading()
          console.error('❌ 后端登录失败:', err)
          wx.showToast({
            title: '登录失败，请重试',
            icon: 'none'
          })
        })
      },
      fail(err) {
        wx.hideLoading()
        console.error('❌ wx.login 失败:', err)
        wx.showToast({
          title: '登录失败',
          icon: 'none'
        })
      }
    })
  },

  // 选择微信头像
  handleChooseAvatar(e) {
    console.log('选择微信头像:', e.detail.avatarUrl)
    this.setData({
      wxAvatarUrl: e.detail.avatarUrl,
      useWxAvatar: true
    })
  },

  // 上传自定义头像
  handleUploadCustomAvatar() {
    const that = this
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success(res) {
        const tempFilePath = res.tempFilePaths[0]
        that.setData({
          tempAvatar: tempFilePath,
          useWxAvatar: false
        })
      }
    })
  },

  // 输入昵称
  handleNicknameInput(e) {
    this.setData({
      tempNickname: e.detail.value,
      useWxNickname: false
    })
  },

  // 使用微信昵称
  handleNicknameBlur(e) {
    const nickname = e.detail.value
    if (nickname) {
      this.setData({
        wxNickname: nickname,
        useWxNickname: true
      })
    }
  },

  // 完成资料设置
  handleCompleteProfile() {
    const that = this
    const { useWxAvatar, wxAvatarUrl, tempAvatar, useWxNickname, wxNickname, tempNickname } = this.data

    // 确定最终使用的头像和昵称
    const finalNickname = useWxNickname ? wxNickname : tempNickname
    const avatarPath = useWxAvatar ? wxAvatarUrl : tempAvatar

    if (!finalNickname) {
      wx.showToast({
        title: '请设置昵称',
        icon: 'none'
      })
      return
    }

    wx.showLoading({ title: '保存中...' })

    // 如果有头像，先处理头像上传
    if (avatarPath) {
      // 下载头像到本地（如果是微信头像）
      const processAvatar = useWxAvatar ?
        new Promise((resolve) => {
          wx.downloadFile({
            url: avatarPath,
            success(res) {
              if (res.statusCode === 200) {
                resolve(res.tempFilePath)
              } else {
                resolve(null)
              }
            },
            fail() {
              resolve(null)
            }
          })
        }) :
        Promise.resolve(avatarPath)

      processAvatar.then(localPath => {
        if (localPath) {
          // 上传到七牛云
          that.uploadAvatarToQiniu(localPath, (qiniuUrl) => {
            // 更新用户资料
            that.updateUserProfile(finalNickname, qiniuUrl)
          })
        } else {
          // 头像处理失败，只更新昵称
          that.updateUserProfile(finalNickname, '')
        }
      })
    } else {
      // 没有头像，只更新昵称
      that.updateUserProfile(finalNickname, '')
    }
  },

  // 更新用户资料
  updateUserProfile(nickname, avatar) {
    const that = this
    const { put } = require('../../utils/request')

    const data = {}
    if (nickname) data.nickname = nickname
    if (avatar) data.avatar = avatar

    console.log('========== 更新用户资料 ==========')
    console.log('更新数据:', data)

    put('/user/profile', data).then(res => {
      wx.hideLoading()
      const userInfo = res.data

      console.log('✅ 用户资料更新成功:', userInfo)

      // 更新全局数据
      app.globalData.userInfo = userInfo
      wx.setStorageSync('userInfo', userInfo)

      that.setData({
        userInfo: userInfo,
        showProfileModal: false
      })

      wx.showToast({
        title: '资料设置成功',
        icon: 'success'
      })
    }).catch(err => {
      wx.hideLoading()
      console.error('❌ 更新资料失败:', err)
      wx.showToast({
        title: '保存失败，请重试',
        icon: 'none'
      })
    })
  },

  // 上传头像到七牛云
  uploadAvatarToQiniu(filePath, callback) {
    console.log('========== 开始上传头像到七牛云 ==========')
    console.log('文件路径:', filePath)

    // 使用公开的上传凭证接口（无需认证）
    wx.request({
      url: `${getApp().globalData.apiBase}/user/public-upload-token`,
      method: 'GET',
      success(res) {
        console.log('获取上传凭证响应:', res.data)
        if (res.data.success) {
          const { token, domain, key } = res.data.data
          console.log('七牛云上传凭证:', { domain, key })

          // 上传到七牛云
          wx.uploadFile({
            url: 'https://upload.qiniup.com',
            filePath: filePath,
            name: 'file',
            formData: {
              token: token,
              key: key
            },
            success(uploadRes) {
              console.log('七牛云上传响应 statusCode:', uploadRes.statusCode)
              console.log('七牛云上传响应 data:', uploadRes.data)
              if (uploadRes.statusCode === 200) {
                try {
                  const data = JSON.parse(uploadRes.data)
                  console.log('七牛云返回的数据:', data)

                  // 七牛云 returnBody 配置返回的数据包含 url 字段
                  let qiniuUrl = data.url
                  if (!qiniuUrl) {
                    // 如果没有 url 字段，手动拼接
                    // domain 已经包含 https://，所以直接拼接
                    qiniuUrl = `${domain}/${data.key}`
                  }

                  console.log('✅ 头像上传成功，最终URL:', qiniuUrl)
                  callback(qiniuUrl)
                } catch (e) {
                  console.error('❌ 解析七牛云响应失败:', e)
                  callback('')
                }
              } else {
                console.error('❌ 七牛云上传失败:', uploadRes)
                callback('')
              }
            },
            fail(err) {
              console.error('❌ 七牛云上传失败:', err)
              callback('')
            }
          })
        } else {
          console.error('❌ 获取上传凭证失败:', res.data)
          callback('')
        }
      },
      fail(err) {
        console.error('❌ 获取上传凭证请求失败:', err)
        callback('')
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
