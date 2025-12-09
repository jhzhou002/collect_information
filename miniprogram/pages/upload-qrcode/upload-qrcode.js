// pages/upload-qrcode/upload-qrcode.js
const app = getApp()
const { uploadImage } = require('../../utils/qiniu')
const { updateQrcode } = require('../../api/user')

Page({
  data: {
    qrcodeUrl: '',
    tempFilePath: ''
  },

  onLoad() {
    // 加载已有的二维码
    const userInfo = app.globalData.userInfo
    if (userInfo && userInfo.qrcode_url) {
      this.setData({
        qrcodeUrl: userInfo.qrcode_url
      })
    }
  },

  // 选择图片
  chooseImage() {
    const that = this

    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success(res) {
        const tempFilePath = res.tempFilePaths[0]

        that.setData({
          tempFilePath: tempFilePath,
          qrcodeUrl: tempFilePath
        })
      }
    })
  },

  // 保存二维码
  saveQrcode() {
    const { tempFilePath, qrcodeUrl } = this.data

    // 判断是否有新选择的图片
    if (!tempFilePath) {
      wx.showToast({
        title: '请先选择图片',
        icon: 'none'
      })
      return
    }

    // 判断是否是临时文件（新上传的图片）
    // 临时文件路径通常以 wxfile:// 或 http://tmp/ 开头
    const isNewImage = tempFilePath.includes('wxfile://') ||
                       tempFilePath.includes('http://tmp/') ||
                       tempFilePath.includes('tempFilePath')

    if (isNewImage) {
      // 新上传的图片，需要上传到七牛云
      wx.showLoading({ title: '上传中...' })

      uploadImage(tempFilePath).then(imageUrl => {
        console.log('七牛云上传成功:', imageUrl)

        // 更新到数据库
        return updateQrcode(imageUrl).then(() => {
          wx.hideLoading()

          // 更新本地用户信息
          const userInfo = app.globalData.userInfo
          userInfo.qrcode_url = imageUrl
          app.globalData.userInfo = userInfo
          wx.setStorageSync('userInfo', userInfo)

          this.setData({
            qrcodeUrl: imageUrl,
            tempFilePath: ''
          })

          wx.showToast({
            title: '保存成功',
            icon: 'success'
          })

          // 延迟返回
          setTimeout(() => {
            wx.navigateBack()
          }, 1500)
        })
      }).catch(err => {
        wx.hideLoading()
        console.error('上传失败:', err)
        wx.showToast({
          title: '上传失败',
          icon: 'none'
        })
      })
    } else {
      // 已经是上传过的图片（七牛云URL）
      wx.showToast({
        title: '无需重复保存',
        icon: 'none'
      })
    }
  }
})
