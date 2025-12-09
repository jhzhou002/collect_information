import request from '../utils/request'

/**
 * 获取提交记录列表
 */
export function getSubmissions(params) {
  return request({
    url: '/admin/submissions',
    method: 'get',
    params
  })
}

/**
 * 获取提交详情
 */
export function getSubmissionDetail(id) {
  return request({
    url: `/admin/submissions/${id}`,
    method: 'get'
  })
}

/**
 * 更新结算状态
 */
export function updateStatus(id, status) {
  return request({
    url: `/admin/submissions/${id}/status`,
    method: 'put',
    data: { status }
  })
}

/**
 * 批量更新结算状态
 */
export function batchUpdateStatus(ids, status) {
  return request({
    url: '/admin/submissions/batch-status',
    method: 'put',
    data: { ids, status }
  })
}

/**
 * 更新备注
 */
export function updateRemark(id, remark) {
  return request({
    url: `/admin/submissions/${id}/remark`,
    method: 'put',
    data: { remark }
  })
}

/**
 * 导出Excel
 */
export function exportExcel(params) {
  return request({
    url: '/admin/submissions/export',
    method: 'get',
    params,
    responseType: 'blob'
  })
}

/**
 * 导出HTML
 */
export function exportHtml(params) {
  return request({
    url: '/admin/submissions/export-html',
    method: 'get',
    params,
    responseType: 'blob'
  })
}

/**
 * 获取统计数据
 */
export function getStatistics() {
  return request({
    url: '/admin/statistics',
    method: 'get'
  })
}

// ============ 首页配置管理 ============

/**
 * 获取所有首页配置
 */
export function getHomeConfigs() {
  return request({
    url: '/admin/home-config',
    method: 'get'
  })
}

/**
 * 添加配置项
 */
export function addHomeConfig(data) {
  return request({
    url: '/admin/home-config',
    method: 'post',
    data
  })
}

/**
 * 更新配置项
 */
export function updateHomeConfig(id, data) {
  return request({
    url: `/admin/home-config/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除配置项
 */
export function deleteHomeConfig(id) {
  return request({
    url: `/admin/home-config/${id}`,
    method: 'delete'
  })
}

// ============ 用户管理 ============

/**
 * 获取用户列表
 */
export function getUserList(params) {
  return request({
    url: '/admin/users',
    method: 'get',
    params
  })
}

/**
 * 获取用户详情
 */
export function getUserDetail(id) {
  return request({
    url: `/admin/users/${id}`,
    method: 'get'
  })
}

// ============ 图片上传 ============

/**
 * 上传图片
 */
export function uploadImage(file) {
  const formData = new FormData()
  formData.append('file', file)
  return request({
    url: '/upload/image',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}
