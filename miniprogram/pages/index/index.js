// pages/index/index.js
const { get } = require('../../utils/request')

Page({
  data: {
    banners: [],
    instructionHtml: '<p>加载中...</p>'
  },

  onLoad() {
    this.loadHomeData()
  },

  // 加载首页数据（轮播图和使用说明）
  loadHomeData() {
    get('/home/config').then(res => {
      const { banners, instructionHtml } = res.data
      this.setData({
        banners: banners || [],
        instructionHtml: instructionHtml || '<p>暂无使用说明</p>'
      })
    }).catch(err => {
      console.log('加载首页配置失败，使用默认配置:', err)
      this.setData({
        banners: [],
        instructionHtml: '<ul><li>首次使用请先在"我的"页面登录</li><li>支持自动识别文本中的链接</li><li>每次最多可提交10个链接</li><li>可在"提交历史"查看记录</li></ul>'
      })
    })
  },

  // 跳转到提交页面
  goToSubmit() {
    wx.navigateTo({
      url: '/pages/submit/submit'
    })
  }
})
