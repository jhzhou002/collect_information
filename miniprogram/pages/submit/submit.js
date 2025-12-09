// pages/submit/submit.js
const app = getApp()
const { extractURL } = require('../../utils/urlExtractor')
const { createSubmission } = require('../../api/submission')

Page({
  data: {
    nickname: '',
    links: ['']
  },

  onLoad() {
    // 检查登录状态
    const token = app.globalData.token
    if (!token) {
      wx.showModal({
        title: '提示',
        content: '请先登录后再提交信息',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            wx.switchTab({
              url: '/pages/mine/mine'
            })
          } else {
            wx.navigateBack()
          }
        }
      })
    }
  },

  // 昵称输入
  onNicknameInput(e) {
    this.setData({
      nickname: e.detail.value
    })
  },

  // 链接输入 - 粘贴后立即自动提取
  onLinkInput(e) {
    const { index } = e.currentTarget.dataset
    const { value } = e.detail
    const links = this.data.links

    // 检测是否包含URL（包含http://或https://）
    if (value && (value.includes('http://') || value.includes('https://'))) {
      // 立即提取URL
      const extractedUrl = extractURL(value)
      links[index] = extractedUrl

      // 如果提取成功且与原文本不同，显示提示
      if (extractedUrl !== value) {
        wx.showToast({
          title: '已自动提取链接',
          icon: 'success',
          duration: 1500
        })
      }
    } else {
      // 普通输入，直接保存
      links[index] = value
    }

    this.setData({ links })
  },

  // 链接失焦 - 最后再检查一次
  onLinkBlur(e) {
    const { index } = e.currentTarget.dataset
    const { value } = e.detail
    const links = this.data.links

    if (value && !value.startsWith('http://') && !value.startsWith('https://')) {
      // 如果失焦时内容不是URL格式，再尝试提取一次
      const extractedUrl = extractURL(value)
      if (extractedUrl !== value) {
        links[index] = extractedUrl
        this.setData({ links })
        wx.showToast({
          title: '已自动提取链接',
          icon: 'success',
          duration: 1500
        })
      }
    }
  },

  // 添加链接
  addLink() {
    const links = this.data.links

    if (links.length >= 10) {
      wx.showToast({
        title: '最多添加10个链接',
        icon: 'none'
      })
      return
    }

    links.push('')
    this.setData({ links })
  },

  // 删除链接
  deleteLink(e) {
    const { index } = e.currentTarget.dataset
    const links = this.data.links

    if (links.length <= 1) {
      wx.showToast({
        title: '至少保留一个链接',
        icon: 'none'
      })
      return
    }

    links.splice(index, 1)
    this.setData({ links })
  },

  // 提交
  handleSubmit() {
    const { nickname, links } = this.data

    // 验证昵称
    if (!nickname || !nickname.trim()) {
      wx.showToast({
        title: '请输入昵称',
        icon: 'none'
      })
      return
    }

    // 验证链接
    const validLinks = links.filter(link => link && link.trim())

    if (validLinks.length === 0) {
      wx.showToast({
        title: '请至少输入一个链接',
        icon: 'none'
      })
      return
    }

    // 提交
    wx.showLoading({ title: '提交中...' })

    createSubmission({
      nickname: nickname.trim(),
      links: validLinks
    }).then(res => {
      wx.hideLoading()
      wx.showModal({
        title: '提交成功',
        content: '您的信息已成功提交',
        showCancel: false,
        success: () => {
          // 返回首页
          wx.switchTab({
            url: '/pages/index/index'
          })
        }
      })
    }).catch(err => {
      wx.hideLoading()
      console.error('提交失败:', err)
    })
  }
})
