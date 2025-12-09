import request from './request'

// 获取提交记录列表
export function getSubmissions(params) {
  return request.get('/admin/submissions', { params })
}

// 获取提交详情
export function getSubmissionDetail(id) {
  return request.get(`/admin/submissions/${id}`)
}

// 更新结算状态
export function updateStatus(id, data) {
  return request.put(`/admin/submissions/${id}/status`, data)
}

// 批量更新结算状态
export function batchUpdateStatus(data) {
  return request.put('/admin/submissions/batch-status', data)
}

// 更新备注
export function updateRemark(id, data) {
  return request.put(`/admin/submissions/${id}/remark`, data)
}

// 导出Excel
export function exportExcel(params) {
  return request.get('/admin/submissions/export', {
    params,
    responseType: 'blob'
  })
}

// 获取统计数据
export function getStatistics() {
  return request.get('/admin/statistics')
}

// ============ 首页配置管理 ============

// 获取所有首页配置
export function getHomeConfigs() {
  return request.get('/admin/home-config')
}

// 添加配置项
export function addHomeConfig(data) {
  return request.post('/admin/home-config', data)
}

// 更新配置项
export function updateHomeConfig(id, data) {
  return request.put(`/admin/home-config/${id}`, data)
}

// 删除配置项
export function deleteHomeConfig(id) {
  return request.delete(`/admin/home-config/${id}`)
}
