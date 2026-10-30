const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const os=require('node:os');const path=require('node:path');const crypto=require('node:crypto');
const {canActivate}=require('../guard.cjs');
function fixture(t){const root=fs.mkdtempSync(path.join(os.tmpdir(),'dsh-guard-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));fs.mkdirSync(path.join(root,'lib'));const files={};for(const name of ['client.js','client.engine.js']){fs.writeFileSync(path.join(root,'lib',name),'valid '+name);files[name]=crypto.createHash('sha256').update('valid '+name).digest('hex')}fs.writeFileSync(path.join(root,'lib','integrity.json'),JSON.stringify({files}));return root;}
test('产物完整即可启用，不依赖宿主版本或版本环境变量',t=>{const root=fixture(t);assert.equal(canActivate(root),true)});
test('插件文件缺失或损坏时不向启动器抛异常',t=>{const root=fixture(t);fs.unlinkSync(path.join(root,'lib','client.engine.js'));assert.equal(canActivate(root),false);fs.writeFileSync(path.join(root,'lib','client.engine.js'),'broken');assert.equal(canActivate(root),false);fs.writeFileSync(path.join(root,'lib','integrity.json'),'broken');assert.equal(canActivate(root),false)});

test('完整发布产物可以直接启用',()=>{assert.equal(canActivate(),true)});
