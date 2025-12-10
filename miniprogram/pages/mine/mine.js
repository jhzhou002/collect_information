// pages/mine/mine.js
const app = getApp()
const { wxLogin, getUserProfile } = require('../../api/user')
const logger = require('../../utils/logger')

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

  // 选择微信头像（使用官方组件）
  handleChooseAvatar(e) {
    console.log('选择微信头像:', e.detail.avatarUrl)
    logger.info('选择微信头像', { avatarUrl: e.detail.avatarUrl })
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
        logger.info('选择自定义头像', { tempFilePath })
        that.setData({
          tempAvatar: tempFilePath,
          wxAvatarUrl: '',
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

    const stateData = {
      useWxAvatar,
      wxAvatarUrl,
      tempAvatar,
      useWxNickname,
      wxNickname,
      tempNickname
    }

    console.log('========== 完成资料设置 ==========')
    console.log('data 状态:', stateData)
    logger.info('开始完成资料设置', stateData)

    // 确定最终使用的头像和昵称
    const finalNickname = useWxNickname ? wxNickname : tempNickname
    const avatarPath = useWxAvatar ? wxAvatarUrl : tempAvatar

    console.log('最终昵称:', finalNickname)
    console.log('最终头像路径:', avatarPath)
    logger.info('资料设置参数', { finalNickname, avatarPath })

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
      console.log('检测到头像路径，开始处理头像上传')
      console.log('是否使用微信头像:', useWxAvatar)
      console.log('头像路径:', avatarPath)
      logger.info('检测到头像，开始处理', { useWxAvatar, avatarPath })

      // 微信官方组件返回的 wxfile:// 协议路径可以直接上传，不需要下载
      // 自定义上传的也是本地临时路径，也可以直接上传
      console.log('直接上传头像，路径:', avatarPath)
      logger.info('准备上传头像', { avatarPath })

      // 上传到后端（后端再上传到七牛云）
      that.uploadAvatarToBackend(avatarPath, (avatarUrl) => {
        console.log('头像上传回调，获得URL:', avatarUrl)
        logger.info('头像上传完成', { avatarUrl, urlLength: avatarUrl ? avatarUrl.length : 0 })

        if (avatarUrl) {
          // 更新用户资料
          that.updateUserProfile(finalNickname, avatarUrl)
        } else {
          console.warn('头像上传失败，只更新昵称')
          logger.warn('头像上传失败，只更新昵称')
          // 头像上传失败，只更新昵称
          that.updateUserProfile(finalNickname, '')
        }
      })
    } else {
      console.log('没有头像路径，只更新昵称')
      logger.warn('没有头像路径，只更新昵称')
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

  // 上传头像（使用后端接口）
  uploadAvatarToBackend(filePath, callback) {
    console.log('========== 开始上传头像 ==========')
    console.log('文件路径:', filePath)
    logger.info('开始上传头像到后端', { filePath })

    wx.uploadFile({
      url: `${getApp().globalData.apiBase}/user/upload-avatar`,
      filePath: filePath,
      name: 'avatar',
      success(res) {
        console.log('后端上传响应 statusCode:', res.statusCode)
        console.log('后端上传响应 data:', res.data)
        logger.info('后端上传响应', { statusCode: res.statusCode, data: res.data })

        if (res.statusCode === 200) {
          try {
            const data = JSON.parse(res.data)
            if (data.success) {
              const avatarUrl = data.data.avatarUrl
              console.log('✅ 头像上传成功，URL:', avatarUrl)
              logger.info('头像上传成功', { avatarUrl })
              callback(avatarUrl)
            } else {
              console.error('❌ 后端返回失败:', data.message)
              logger.error('后端返回失败', { message: data.message })
              callback('')
            }
          } catch (e) {
            console.error('❌ 解析响应失败:', e)
            logger.error('解析响应失败', { error: e.message, data: res.data })
            callback('')
          }
        } else {
          console.error('❌ 上传失败，状态码:', res.statusCode)
          logger.error('上传失败', { statusCode: res.statusCode, data: res.data })
          callback('')
        }
      },
      fail(err) {
        console.error('❌ 上传请求失败:', err)
        logger.error('上传请求失败', err)
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
