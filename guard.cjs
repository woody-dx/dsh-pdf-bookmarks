const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
/** 仅运行经过验证的版本与完整产物，任何检查异常都只关闭本插件。 */
exports.canActivate = function canActivate(version, root = __dirname) {
 try {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'lib/integrity.json'), 'utf8'));
  if (!manifest.supportedVersions.includes(version)) return false;
  for (const name of ['client.js', 'client.engine.js']) {
   const bytes = fs.readFileSync(path.join(root, 'lib', name));
   if (crypto.createHash('sha256').update(bytes).digest('hex') !== manifest.files[name]) return false;
  }
  return true;
 } catch { return false; }
};
