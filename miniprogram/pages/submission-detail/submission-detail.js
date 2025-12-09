// pages/submission-detail/submission-detail.js
const { getSubmissionDetail } = require('../../api/submission')

Page({
  data: {
    submissionId: null,
    submission: null,
    links: [],
    formattedTime: ''
  },

  onLoad(options) {
    const { id } = options
    if (id) {
      this.setData({ submissionId: id })
      this.loadDetail()
    } else {
      wx.showToast({
        title: '参数错误',
        icon: 'none'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }
  },

  // 加载详情
  loadDetail() {
    wx.showLoading({ title: '加载中...' })

    getSubmissionDetail(this.data.submissionId).then(res => {
      wx.hideLoading()
      const { submission, links } = res.data

      // 格式化时间：2025-12-09 21:06
      const formattedTime = this.formatTime(submission.created_at)

      this.setData({
        submission,
        links,
        formattedTime
      })
    }).catch(err => {
      wx.hideLoading()
      console.error('加载详情失败:', err)
      wx.showModal({
        title: '加载失败',
        content: '无法加载提交详情，请重试',
        showCancel: false,
        success: () => {
          wx.navigateBack()
        }
      })
    })
  },

  // 格式化时间
  formatTime(dateString) {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hour = String(date.getHours()).padStart(2, '0')
    const minute = String(date.getMinutes()).padStart(2, '0')

    return `${year}-${month}-${day} ${hour}:${minute}`
  },

  // 复制链接
  copyLink(e) {
    const { url } = e.currentTarget.dataset
    wx.setClipboardData({
      data: url,
      success: () => {
        wx.showToast({
          title: '链接已复制',
          icon: 'success'
        })
      }
    })
  },

  // 返回
  goBack() {
    wx.navigateBack()
  }
})
