const request = require('../utils/request')

/**
 * 创建提交记录
 */
function createSubmission(data) {
  return request.post('/submissions', data)
}

/**
 * 获取提交历史
 */
function getHistory(page = 1, pageSize = 10) {
  return request.get('/submissions/history', { page, pageSize })
}

/**
 * 获取提交详情
 */
function getDetail(id) {
  return request.get(`/submissions/${id}`)
}

/**
 * 获取提交详情（带链接）
 */
function getSubmissionDetail(id) {
  return request.get(`/submissions/detail/${id}`)
}

module.exports = {
  createSubmission,
  getHistory,
  getDetail,
  getSubmissionDetail
}
