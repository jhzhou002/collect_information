const qiniu = require('qiniu');
const { generateUploadToken } = require('../config/qiniu');

/**
 * 获取七牛云上传凭证
 * GET /api/upload/token
 */
exports.getUploadToken = async (req, res) => {
  try {
    const tokenData = generateUploadToken();

    res.json({
      success: true,
      data: tokenData
    });
  } catch (error) {
    console.error('获取上传凭证错误:', error);
    res.status(500).json({
      success: false,
      message: '获取上传凭证失败',
      error: error.message
    });
  }
};

/**
 * 上传图片到七牛云（用于富文本编辑器）
 * POST /api/upload/image
 */
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请上传图片文件'
      });
    }

    const file = req.file;
    const key = `editor/${Date.now()}_${Math.random().toString(36).slice(2)}.${file.originalname.split('.').pop()}`;

    const tokenData = generateUploadToken(key);
    const config = new qiniu.conf.Config();
    const formUploader = new qiniu.form_up.FormUploader(config);
    const putExtra = new qiniu.form_up.PutExtra();

    // 上传文件到七牛云
    formUploader.put(tokenData.token, key, file.buffer, putExtra, (err, body, info) => {
      if (err) {
        console.error('上传七牛云错误:', err);
        return res.status(500).json({
          success: false,
          message: '上传失败',
          error: err.message
        });
      }

      if (info.statusCode === 200) {
        res.json({
          success: true,
          data: {
            url: body.url
          }
        });
      } else {
        res.status(info.statusCode).json({
          success: false,
          message: '上传失败',
          error: body
        });
      }
    });

  } catch (error) {
    console.error('上传图片错误:', error);
    res.status(500).json({
      success: false,
      message: '上传失败',
      error: error.message
    });
  }
};
