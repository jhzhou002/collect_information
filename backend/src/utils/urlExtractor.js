/**
 * URL自动提取工具
 * 类似抖音口令，从文本中提取URL
 */

/**
 * 从文本中提取URL
 * @param {string} text - 包含URL的文本
 * @returns {string} 提取的URL，如果没有则返回原文本
 */
function extractURL(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }

  // URL正则表达式（支持http、https、ftp等协议）
  const urlRegex = /(https?:\/\/[^\s\u4e00-\u9fa5]+)/gi;

  const matches = text.match(urlRegex);

  if (matches && matches.length > 0) {
    // 返回第一个匹配的URL
    return matches[0].trim();
  }

  // 如果没有匹配到URL，返回原文本
  return text.trim();
}

/**
 * 批量提取URL
 * @param {Array<string>} texts - 文本数组
 * @returns {Array<string>} 提取的URL数组
 */
function extractURLs(texts) {
  if (!Array.isArray(texts)) {
    return [];
  }

  return texts.map(text => extractURL(text)).filter(url => url);
}

/**
 * 验证URL格式
 * @param {string} url - 待验证的URL
 * @returns {boolean} 是否为有效URL
 */
function isValidURL(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch (e) {
    return false;
  }
}

module.exports = {
  extractURL,
  extractURLs,
  isValidURL
};
