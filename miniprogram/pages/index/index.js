// pages/index/index.js
const { get } = require('../../utils/request')

Page({
  data: {
    banners: [],
    instructionHtml: '<p>加载中...</p>',
    noticeText: '', // 测试: '欢迎使用小信册，请先在"我的"页面登录后再提交信息',
    noticeAnimation: null
  },

  onLoad() {
    this.loadHomeData()
  },

  onShow() {
    // 每次显示页面时重新启动滚动动画
    if (this.data.noticeText) {
      this.startNoticeAnimation()
    }
  },

  onHide() {
    // 页面隐藏时清除动画
    if (this.animationInterval) {
      clearInterval(this.animationInterval)
    }
  },

  // 加载首页数据（轮播图和使用说明）
  loadHomeData() {
    get('/home/config').then(res => {
      console.log('首页配置加载成功:', res.data)
      const { banners, instructionHtml, noticeText } = res.data || {}

      // 清理和验证 HTML 内容
      let cleanHtml = instructionHtml || ''
      if (cleanHtml && typeof cleanHtml === 'string') {
        // 移除可能导致问题的标签和属性
        cleanHtml = cleanHtml.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        cleanHtml = cleanHtml.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        cleanHtml = cleanHtml.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
      }

      console.log('noticeText 原始数据:', noticeText)
      console.log('noticeText 类型:', typeof noticeText)

      this.setData({
        banners: Array.isArray(banners) ? banners : [],
        instructionHtml: cleanHtml || '<p>暂无使用说明</p>',
        noticeText: noticeText || ''
      }, () => {
        console.log('setData 后的 noticeText:', this.data.noticeText)
        // 数据设置完成后启动通知滚动动画
        if (this.data.noticeText) {
          console.log('开始启动通知滚动动画')
          this.startNoticeAnimation()
        } else {
          console.log('noticeText 为空，不显示通知条')
        }
      })
    }).catch(err => {
      console.error('加载首页配置失败:', err)
      this.setData({
        banners: [],
        instructionHtml: '<div style="padding: 10px;"><p><strong>使用说明：</strong></p><ul><li>首次使用请先在"我的"页面登录</li><li>支持自动识别文本中的链接</li><li>每次最多可提交10个链接</li><li>可在"提交历史"查看记录</li></ul></div>',
        noticeText: ''
      })
    })
  },

  // 启动通知滚动动画
  startNoticeAnimation() {
    // 清除之前的动画
    if (this.animationInterval) {
      clearInterval(this.animationInterval)
    }

    let position = 100 // 从右侧开始
    const animation = wx.createAnimation({
      duration: 0,
      timingFunction: 'linear'
    })

    this.animationInterval = setInterval(() => {
      position -= 0.5 // 控制滚动速度
      if (position < -100) {
        position = 100 // 滚动到左侧后重新从右侧开始
      }
      animation.translateX(`${position}%`).step()
      this.setData({
        noticeAnimation: animation.export()
      })
    }, 20)
  },

  // 跳转到提交页面
  goToSubmit() {
    wx.navigateTo({
      url: '/pages/submit/submit'
    })
  },

  // 分享小程序
  onShareAppMessage() {
    return {
      title: '小信册 - 信息收集系统',
      path: '/pages/index/index',
      imageUrl: this.data.banners.length > 0 ? this.data.banners[0] : ''
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '小信册 - 信息收集系统',
      imageUrl: this.data.banners.length > 0 ? this.data.banners[0] : ''
    }
  }
})
