import React from 'react';
import {createRoot} from 'react-dom/client';
const factories=new Map();
window.__ModuleLoader__={load:record=>factories.set(record.chunk||'client.js',record.factory)};
const modules={'react':React,'react/jsx-runtime':await import('react/jsx-runtime'),'@deepseek-ai/dsh-client-ui-primitives':{Button:props=>React.createElement('button',props)}};
function requireModule(name){if(modules[name])return modules[name];throw new Error('Missing shared module '+name)}
requireModule.async=async name=>{
 const chunk=name.replace('./','');
 if(new URL(location.href).searchParams.has('fail-engine'))throw new Error('Injected engine transport failure');
 if(!factories.has(chunk))await loadScript('/lib/'+chunk);
 return factories.get(chunk)(requireModule);
};
async function loadScript(src){await new Promise((resolve,reject)=>{const node=document.createElement('script');node.src=src;node.onload=resolve;node.onerror=reject;document.head.append(node)})}
await loadScript('/lib/client.js');
const plugin=factories.get('client.js')(requireModule);
const root=createRoot(document.getElementById('app'));
const signal=new AbortController().signal,slots=new Map(),definitions=new Map();let data;
const cleanups=[];
function render(){
 const id=[...definitions.keys()][0];
 root.render(id?React.createElement(slots.get(id),{resourceAddress:'dsh-resource://file/session/test/book.pdf',content:{kind:'bytes',data},useTabInfo:()=>({tab:{id:'preview',signal}})}):React.createElement('div',{role:'status'},'内置 PDF 预览已恢复'));
}
const ctx={effect(fn){const value=fn();if(typeof value==='function')cleanups.push(value)},slots:{inject(name,fn){const iterator=fn();if(iterator?.next){for(const value of iterator)if(typeof value==='function')cleanups.push(value)}},register({key},component){slots.set(key,component);return ()=>slots.delete(key)}},documentPreviews:{register(def){definitions.set(def.id,def);return ()=>{definitions.delete(def.id);render()}}}};
data=new Uint8Array(await (await fetch(new URL(location.href).searchParams.has('no-outline')?'/test/plain.pdf':'/test/book.pdf')).arrayBuffer());
plugin.apply(ctx);render();
