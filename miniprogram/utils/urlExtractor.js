/**
 * URL自动提取工具（前端版本）
 */

/**
 * 从文本中提取URL
 * @param {string} text - 包含URL的文本
 * @returns {string} 提取的URL，如果没有则返回原文本
 */
function extractURL(text) {
  if (!text || typeof text !== 'string') {
    return ''
  }

  // URL正则表达式（支持http、https）
  const urlRegex = /(https?:\/\/[^\s\u4e00-\u9fa5]+)/gi

  const matches = text.match(urlRegex)

  if (matches && matches.length > 0) {
    // 返回第一个匹配的URL
    return matches[0].trim()
  }

  // 如果没有匹配到URL，返回原文本
  return text.trim()
}

module.exports = {
  extractURL
}
