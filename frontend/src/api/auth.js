import request from '../utils/request'

/**
 * 管理员登录
 */
export function adminLogin(data) {
  return request({
    url: '/auth/admin-login',
    method: 'post',
    data
  })
}
