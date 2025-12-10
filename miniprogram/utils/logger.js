/**
 * 前端日志工具 - 将日志发送到服务器
 */

const app = getApp()

/**
 * 发送日志到服务器
 * @param {string} level - 日志级别：info, warn, error
 * @param {string} message - 日志消息
 * @param {any} data - 附加数据
 */
function sendLog(level, message, data = null) {
  // 先在本地控制台输出
  const logFunc = console[level] || console.log
  logFunc(`[${level.toUpperCase()}] ${message}`, data)

  // 发送到服务器（不阻塞，失败也不影响）
  try {
    wx.request({
      url: `${app.globalData.apiBase}/log/client`,
      method: 'POST',
      data: {
        level,
        message,
        data: data ? JSON.stringify(data) : null,
        timestamp: new Date().toISOString()
      },
      header: {
        'Content-Type': 'application/json'
      },
      fail(err) {
        console.warn('发送日志到服务器失败:', err)
      }
    })
  } catch (e) {
    // 静默失败，不影响主流程
  }
}

module.exports = {
  info: (message, data) => sendLog('info', message, data),
  warn: (message, data) => sendLog('warn', message, data),
  error: (message, data) => sendLog('error', message, data),
  log: (message, data) => sendLog('info', message, data)
}
