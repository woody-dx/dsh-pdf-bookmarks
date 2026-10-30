const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function fixture() {
 let factory;
 const warnings = [];
 vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../lib/client.js'), 'utf8'), {
  window: { __ModuleLoader__: { load: record => { factory = record.factory; } } },
  console: { warn: (...args) => warnings.push(args) },
 });
 const plugin = factory(name => { assert.equal(name, 'react'); return require('react'); });
 const slots = new Map(), definitions = new Map(), cleanups = [];
 let injections = 0;
 const ctx = {
  effect(fn) { const cleanup = fn(); if (typeof cleanup === 'function') cleanups.push(cleanup); },
  slots: {
   inject(name, fn) {
    injections++;
    for (const cleanup of fn()) if (typeof cleanup === 'function') cleanups.push(cleanup);
   },
   register({ key }, component) { slots.set(key, component); return () => slots.delete(key); },
  },
  documentPreviews: {
   register(definition) { definitions.set(definition.id, definition); return () => definitions.delete(definition.id); },
  },
 };
 return { plugin, ctx, slots, definitions, warnings, injections: () => injections, dispose: () => cleanups.reverse().forEach(fn => fn()) };
}

test('接口可用时注册 PDF 预览，停用后清理查看器和定义', () => {
 const f = fixture();
 f.plugin.apply(f.ctx);
 assert.equal(f.definitions.get('dsh-pdf-bookmarks/pdf').loading, 'bytes-complete');
 assert.equal(f.slots.size, 1);
 f.dispose();
 assert.equal(f.slots.size, 0);
 assert.equal(f.definitions.size, 0);
});

test('缺少所需接口时在注入前退出，保留内置预览', () => {
 for (const missing of ['effect', 'inject', 'register', 'documentPreviews']) {
  const f = fixture();
  if (missing === 'effect' || missing === 'documentPreviews') delete f.ctx[missing];
  else delete f.ctx.slots[missing];
  assert.doesNotThrow(() => f.plugin.apply(f.ctx));
  assert.equal(f.injections(), 0, missing);
  assert.equal(f.slots.size, 0, missing);
  assert.equal(f.definitions.size, 0, missing);
  assert.equal(f.warnings.length, 1, missing);
 }
});

test('预览定义注册失败立即清理已注册的查看器', () => {
 const f = fixture();
 f.ctx.documentPreviews.register = () => { throw new Error('changed host API'); };
 assert.doesNotThrow(() => f.plugin.apply(f.ctx));
 assert.equal(f.slots.size, 0);
 assert.equal(f.definitions.size, 0);
 assert.equal(f.warnings.length, 1);
});
