const qiniu = require('qiniu');
require('dotenv').config();

// 七牛云配置
const accessKey = process.env.QINIU_ACCESS_KEY;
const secretKey = process.env.QINIU_SECRET_KEY;
const bucket = process.env.QINIU_BUCKET;
const domain = process.env.QINIU_DOMAIN;
const path = process.env.QINIU_PATH;

const mac = new qiniu.auth.digest.Mac(accessKey, secretKey);

// 生成上传凭证（供前端直传使用）
function generateUploadToken() {
  // 生成唯一的文件名
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 15);
  const key = `${path}/avatar_${timestamp}_${randomStr}.jpg`;

  const options = {
    scope: `${bucket}:${key}`,
    expires: 3600, // 1小时有效期
    returnBody: JSON.stringify({
      key: '$(key)',
      hash: '$(etag)',
      url: `${domain}/$(key)`
    })
  };

  const putPolicy = new qiniu.rs.PutPolicy(options);
  const uploadToken = putPolicy.uploadToken(mac);

  return {
    token: uploadToken,
    domain: domain,
    key: key
  };
}

module.exports = {
  generateUploadToken
};
