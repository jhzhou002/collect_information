// 网络请求封装
const app = getApp()

// 请求拦截
function request(options) {
  const { url, method = 'GET', data = {}, header = {} } = options

  const fullUrl = `${app.globalData.apiBase}${url}`
  console.log('========== 发起网络请求 ==========')
  console.log('请求地址:', fullUrl)
  console.log('请求方法:', method)
  console.log('请求参数:', data)
  console.log('请求头:', {
    'Content-Type': 'application/json',
    'Authorization': app.globalData.token ? `Bearer ${app.globalData.token}` : '(无)',
    ...header
  })

  return new Promise((resolve, reject) => {
    wx.request({
      url: fullUrl,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        'Authorization': app.globalData.token ? `Bearer ${app.globalData.token}` : '',
        ...header
      },
      success(res) {
        console.log('========== 网络请求响应 ==========')
        console.log('状态码:', res.statusCode)
        console.log('响应数据:', res.data)

        const { statusCode, data } = res

        // HTTP状态码处理
        if (statusCode === 200) {
          if (data.success) {
            console.log('✅ 请求成功')
            resolve(data)
          } else {
            console.error('❌ 业务失败:', data.message)
            wx.showToast({
              title: data.message || '请求失败',
              icon: 'none'
            })
            reject(data)
          }
        } else if (statusCode === 401) {
          console.error('❌ 登录已过期')
          wx.showToast({
            title: '登录已过期，请重新登录',
            icon: 'none'
          })
          // 清除token
          app.globalData.token = null
          wx.removeStorageSync('token')
          wx.removeStorageSync('userInfo')
          // 跳转到首页重新登录
          setTimeout(() => {
            wx.reLaunch({
              url: '/pages/index/index'
            })
          }, 1500)
          reject(res)
        } else {
          console.error('❌ HTTP错误:', statusCode, data)
          wx.showToast({
            title: data.message || '请求失败',
            icon: 'none'
          })
          reject(res)
        }
      },
      fail(err) {
        console.error('❌ 网络请求失败:', err)
        console.error('错误详情:', JSON.stringify(err))
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        })
        reject(err)
      }
    })
  })
}

module.exports = {
  get: (url, data) => request({ url, method: 'GET', data }),
  post: (url, data) => request({ url, method: 'POST', data }),
  put: (url, data) => request({ url, method: 'PUT', data }),
  delete: (url, data) => request({ url, method: 'DELETE', data })
}
