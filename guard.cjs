const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
/** 只加载完整产物；宿主接口兼容性由客户端检查，异常只关闭本插件。 */
exports.canActivate = function canActivate(root = __dirname) {
 try {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'lib/integrity.json'), 'utf8'));
  for (const name of ['client.js', 'client.engine.js']) {
   const bytes = fs.readFileSync(path.join(root, 'lib', name));
   if (crypto.createHash('sha256').update(bytes).digest('hex') !== manifest.files[name]) return false;
  }
  return true;
 } catch { return false; }
};
