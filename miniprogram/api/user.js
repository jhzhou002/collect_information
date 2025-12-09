const request = require('../utils/request')

/**
 * 微信登录
 */
function wxLogin(data) {
  return request.post('/auth/wx-login', data)
}

/**
 * 获取用户信息
 */
function getUserProfile() {
  return request.get('/user/profile')
}

/**
 * 更新二维码
 */
function updateQrcode(qrcodeUrl) {
  return request.post('/user/qrcode', { qrcode_url: qrcodeUrl })
}

module.exports = {
  wxLogin,
  getUserProfile,
  updateQrcode
}
