const {spawn}=require('node:child_process');const fs=require('node:fs');const path=require('node:path');
const source=path.resolve(process.env.DSH_PDF_PACKAGE||'.');
const resources='/Applications/DeepSeek Harness.app/Contents/Resources';
async function run(variant){
 const root=path.resolve('test/host-'+variant);fs.mkdirSync(root,{recursive:true});
 const home=path.join(root,'home'),project=path.join(home,'profiles/desktop'),plugin=variant==='linked'?path.join(root,'local plugin'):path.join(project,'node_modules/dsh-pdf-bookmarks');
 fs.mkdirSync(project,{recursive:true});fs.mkdirSync(path.dirname(plugin),{recursive:true});
 fs.mkdirSync(plugin,{recursive:true});
 for(const name of ['package.json','index.js','guard.cjs','cordis.patch.yml'])fs.copyFileSync(path.join(source,name),path.join(plugin,name));
 fs.cpSync(path.join(source,'lib'),path.join(plugin,'lib'),{recursive:true});
 if(variant==='missing-engine')fs.unlinkSync(path.join(plugin,'lib/client.engine.js'));
 fs.mkdirSync(path.join(project,'node_modules'),{recursive:true});
 const link=path.join(project,'node_modules/dsh-pdf-bookmarks');if(variant==='linked'&&!fs.existsSync(link))fs.symlinkSync(plugin,link);
 fs.writeFileSync(path.join(project,'package.json'),JSON.stringify({name:'dsh-test-desktop',private:true,dsh:{profile:{bundles:['@deepseek-ai/dsh-base','@deepseek-ai/dsh-web-app','dsh-pdf-bookmarks']}},dependencies:{'dsh-pdf-bookmarks':'link:'+plugin}}));
 fs.writeFileSync(path.join(project,'cordis.yml'),'[]\n');fs.writeFileSync(path.join(project,'cordis.patch.yml'),'[]\n');
 return await new Promise((resolve,reject)=>{
  const child=spawn(resources+'/../MacOS/DeepSeek Harness',['--expose-internals',resources+'/app.asar/dsh/node_modules/@deepseek-ai/dsh-desktop-host/lib/index.js',resources+'/app.asar/dsh',project,resources+'/runtime/primary-runtime'],{cwd:root,env:{...process.env,ELECTRON_RUN_AS_NODE:'1',DSH_HOME:home,DSH_CLIENT_VERSION:variant==='unsupported'?'99.0.0':'0.2.1-rc.2',DSH_TELEMETRY_DISABLED:'1'},stdio:['ignore','pipe','pipe','ipc']});
  let ready=false,registered=false,output='';
  const timer=setTimeout(()=>{child.kill('SIGTERM');reject(new Error(variant+' timeout '+output.slice(-1000)))},20000);
  child.stdout.on('data',x=>output+=x);child.stderr.on('data',x=>output+=x);
  child.on('message',message=>{
   if(message.type==='ready'){
    ready=true;registered=JSON.stringify(message.injections).includes('dsh-pdf-bookmarks');child.send({type:'shutdown'});
   } else if(message.type==='fatal'){output+=message.message;}
  });
  child.on('close',code=>{clearTimeout(timer);fs.writeFileSync(path.join(root,'host.log'),output);if(!ready||code!==0||registered!==(['normal','linked'].includes(variant)))reject(new Error(JSON.stringify({variant,ready,registered,code,tail:output.slice(-1500)})));else{console.log(JSON.stringify({variant,hostReady:ready,pluginRegistered:registered,exit:code}));resolve()}});
 });
}
(async()=>{for(const variant of ['normal','linked','unsupported','missing-engine'])await run(variant)})().catch(error=>{console.error(error);process.exitCode=1});
