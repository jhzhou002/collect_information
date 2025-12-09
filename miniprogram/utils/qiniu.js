/**
 * 七牛云图片上传工具
 */

const request = require('./request')

/**
 * 上传图片到七牛云
 * @param {string} filePath - 本地图片路径
 * @returns {Promise<string>} 返回图片URL
 */
function uploadImage(filePath) {
  return new Promise(async (resolve, reject) => {
    try {
      // 1. 获取七牛云上传凭证（后端已经生成了唯一的 key）
      const tokenRes = await request.get('/user/upload-token')
      const { token, domain, key } = tokenRes.data

      console.log('========== 七牛云上传 ==========')
      console.log('上传凭证:', { domain, key })

      // 2. 上传到七牛云
      wx.uploadFile({
        url: 'https://upload.qiniup.com',
        filePath: filePath,
        name: 'file',
        formData: {
          token: token,
          key: key
        },
        success(res) {
          console.log('七牛云上传响应 statusCode:', res.statusCode)
          console.log('七牛云上传响应 data:', res.data)

          if (res.statusCode === 200) {
            try {
              const data = JSON.parse(res.data)
              console.log('七牛云返回的数据:', data)
              // 七牛云 returnBody 返回的数据包含 url 字段
              const imageUrl = data.url || `${domain}/${data.key}`
              console.log('✅ 图片上传成功，URL:', imageUrl)
              resolve(imageUrl)
            } catch (e) {
              console.error('❌ 解析七牛云响应失败:', e)
              reject(new Error('解析上传响应失败'))
            }
          } else {
            console.error('❌ 七牛云上传失败，状态码:', res.statusCode)
            reject(new Error(`上传失败: ${res.statusCode}`))
          }
        },
        fail(err) {
          console.error('❌ 七牛云上传请求失败:', err)
          reject(err)
        }
      })

    } catch (error) {
      console.error('❌ 获取上传凭证失败:', error)
      reject(error)
    }
  })
}

module.exports = {
  uploadImage
}
