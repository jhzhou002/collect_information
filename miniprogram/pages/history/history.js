// pages/history/history.js
const { getHistory, getDetail } = require('../../api/submission')

Page({
  data: {
    list: [],
    page: 1,
    pageSize: 10,
    hasMore: true
  },

  onLoad() {
    this.loadData()
  },

  // 加载数据
  loadData() {
    const { page, pageSize } = this.data

    wx.showLoading({ title: '加载中...' })

    getHistory(page, pageSize).then(res => {
      wx.hideLoading()

      const { list, total } = res.data
      const hasMore = list.length < total && list.length === pageSize

      // 格式化每条记录的时间
      const formattedList = list.map(item => {
        return {
          ...item,
          created_at: this.formatTime(item.created_at),
          remark: item.remark || '暂无备注'
        }
      })

      this.setData({
        list: formattedList,
        hasMore: hasMore
      })
    }).catch(err => {
      wx.hideLoading()
      console.error('加载历史记录失败:', err)
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

  // 查看详情 - 跳转到详情页面
  viewDetail(e) {
    const { id } = e.currentTarget.dataset

    wx.navigateTo({
      url: `/pages/submission-detail/submission-detail?id=${id}`
    })
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.setData({
      page: 1
    })
    this.loadData()
    wx.stopPullDownRefresh()
  },

  // 上拉加载更多
  onReachBottom() {
    if (this.data.hasMore) {
      this.setData({
        page: this.data.page + 1
      })
      this.loadData()
    }
  }
})
