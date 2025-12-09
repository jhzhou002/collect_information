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
      // 1. 获取七牛云上传凭证
      const tokenRes = await request.get('/user/upload-token')
      const { token, domain, path } = tokenRes.data

      // 2. 生成文件名
      const timestamp = Date.now()
      const random = Math.floor(Math.random() * 10000)
      const key = `${path}${timestamp}_${random}.jpg`

      // 3. 上传到七牛云
      wx.uploadFile({
        url: 'https://upload.qiniup.com',
        filePath: filePath,
        name: 'file',
        formData: {
          token: token,
          key: key
        },
        success(res) {
          if (res.statusCode === 200) {
            const data = JSON.parse(res.data)
            const imageUrl = data.url || `${domain}/${key}`
            resolve(imageUrl)
          } else {
            reject(new Error('上传失败'))
          }
        },
        fail(err) {
          reject(err)
        }
      })

    } catch (error) {
      reject(error)
    }
  })
}

module.exports = {
  uploadImage
}
