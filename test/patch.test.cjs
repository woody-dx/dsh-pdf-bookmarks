const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { pathToFileURL } = require('node:url');
const vm = require('node:vm');
const patch = fs.readFileSync(path.join(__dirname, '../cordis.patch.yml'), 'utf8');
const expression = JSON.parse(patch.match(/disabled: !!js (.+)/)[1]);
function fixture(t, linked = false) {
 const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dsh patch '));
 t.after(() => fs.rmSync(root, { recursive: true, force: true }));
 const profile = path.join(root, 'profile');
 const pkg = linked ? path.join(root, 'local plugin') : path.join(profile, 'node_modules/dsh-pdf-bookmarks');
 fs.mkdirSync(path.join(pkg, 'lib'), { recursive: true });
 fs.mkdirSync(profile, { recursive: true });
 fs.writeFileSync(path.join(profile, 'package.json'), '{}');
 fs.copyFileSync(path.join(__dirname, '../guard.cjs'), path.join(pkg, 'guard.cjs'));
 fs.writeFileSync(path.join(pkg, 'package.json'), JSON.stringify({ name: 'dsh-pdf-bookmarks', exports: { './package.json': './package.json' } }));
 if (linked) {
  fs.mkdirSync(path.join(profile, 'node_modules'), { recursive: true });
  fs.symlinkSync(pkg, path.join(profile, 'node_modules/dsh-pdf-bookmarks'));
 }
 const files = {};
 for (const name of ['client.js', 'client.engine.js']) {
  fs.writeFileSync(path.join(pkg, 'lib', name), name);
  files[name] = crypto.createHash('sha256').update(name).digest('hex');
 }
 fs.writeFileSync(path.join(pkg, 'lib/integrity.json'), JSON.stringify({ files }));
 const disabled = (version = '0.2.1-rc.2') => vm.runInNewContext(expression, {
  URL,
  baseUrl: pathToFileURL(profile + path.sep).href,
  process: { getBuiltinModule: require, env: { DSH_CLIENT_VERSION: version } },
  dshHomePath: (...parts) => path.join(root, 'unrelated home', ...parts),
 });
 return { pkg, disabled };
}
test('普通包安装从当前 profile 找到 guard，无需固定用户目录', t => {
 assert.equal(fixture(t).disabled(), false);
});
test('链接安装和带空格路径可以正常启用', t => {
 assert.equal(fixture(t, true).disabled(), false);
});
test('未知或缺失宿主版本仍启用，损坏引擎只禁用自身', t => {
 const f = fixture(t);
 assert.equal(f.disabled('0.2.1-rc.5'), false);
 assert.equal(f.disabled('99.0.0'), false);
 assert.equal(f.disabled(''), false);
 fs.unlinkSync(path.join(f.pkg, 'lib/client.engine.js'));
 assert.equal(f.disabled(), true);
});
test('保护脚本或整个插件缺失时不向 Loader 抛出异常', t => {
 const f = fixture(t);
 fs.unlinkSync(path.join(f.pkg, 'guard.cjs'));
 assert.equal(f.disabled(), true);
 fs.rmSync(f.pkg, { recursive: true });
 assert.equal(f.disabled(), true);
});
