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
function generateUploadToken(key = null) {
  const options = {
    scope: key ? `${bucket}:${key}` : bucket,
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
    path: path
  };
}

module.exports = {
  generateUploadToken
};
