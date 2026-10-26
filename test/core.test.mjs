import test from 'node:test';
import assert from 'node:assert/strict';
import {createBookmarkStore, resolveDestination, documentKey, readingPosition} from '../src/core.js';
const memory = () => {const map=new Map();return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)}};

test('书签保存、改名和删除后重新打开仍恢复，文档间互不串用', () => {
 const storage=memory(), store=createBookmarkStore(storage,'book-a');
 const added=store.add({page:2,offset:0.25,label:'第一章'});
 store.rename(added.id,'需要复习');
 assert.deepEqual(createBookmarkStore(storage,'book-a').list().map(({page,offset,label})=>({page,offset,label})),[{page:2,offset:0.25,label:'需要复习'}]);
 assert.deepEqual(createBookmarkStore(storage,'book-b').list(),[]);
 store.remove(added.id);assert.deepEqual(createBookmarkStore(storage,'book-a').list(),[]);
});
test('损坏的数据、未知 schema 与写入失败不能覆盖原书签，也不能谎报成功', () => {
 for(const raw of ['{broken','{"version":2,"bookmarks":[]}','{"version":1,"bookmarks":[{"page":0}]}']) {
  let writes=0;const store=createBookmarkStore({getItem:()=>raw,setItem:()=>writes++},'book');
  assert.throws(()=>store.list());assert.throws(()=>store.add({page:1,offset:0,label:'x'}));assert.equal(writes,0);
 }
 const store=createBookmarkStore({getItem:()=>null,setItem:()=>{throw new Error('quota')}},'book');
 assert.throws(()=>store.add({page:1,offset:0,label:'x'}),/quota/);assert.deepEqual(store.list(),[]);
});
test('拒绝无效页码和位置，允许同一页的多个阅读位置', () => {
 const store=createBookmarkStore(memory(),'book');
 for(const value of [{page:0,offset:0},{page:1.5,offset:0},{page:1,offset:NaN},{page:1,offset:1.1}])assert.throws(()=>store.add({...value,label:'x'}));
 store.add({page:3,offset:0.1,label:'A'});store.add({page:3,offset:0.7,label:'B'});assert.equal(store.list().length,2);
});
test('命名与显式章节目标均解析到正确页码和页内位置',async()=>{
 const doc={numPages:5,getDestination:async n=>n==='chapter'?[{num:9,gen:0},{name:'XYZ'},0,600,null]:null,getPageIndex:async ref=>{assert.deepEqual(ref,{num:9,gen:0});return 2},getPage:async()=>({getViewport:()=>({height:800,convertToViewportPoint:(x,y)=>[x,800-y]})})};
 assert.deepEqual(await resolveDestination(doc,'chapter'),{page:3,offset:0.25});
 assert.deepEqual(await resolveDestination(doc,[1,{name:'Fit'}]),{page:2,offset:0});
 assert.deepEqual(await resolveDestination(doc,[2,{name:'FitH'},400]),{page:3,offset:0.5});
 assert.deepEqual(await resolveDestination(doc,[2,{name:'XYZ'},null,null,null]),{page:3,offset:0});
 await assert.rejects(()=>resolveDestination(doc,'missing'));
 await assert.rejects(()=>resolveDestination(doc,[99,{name:'Fit'}]));
});
test('同一 PDF 复制或重开仍是同一书签集合，内容变化后分离',async()=>{
 const a=new Uint8Array([37,80,68,70]);
 assert.equal(await documentKey(a),await documentKey(a.slice()));
 assert.notEqual(await documentKey(a),await documentKey(new Uint8Array([37,80,68,71])));
});

test('末页不足一屏时以主要可见页保存书签，不误记前一页',()=>{
 assert.deepEqual(readingPosition([{page:2,top:-400,bottom:220},{page:3,top:232,bottom:850}],0,850),{page:3,offset:0});
 assert.deepEqual(readingPosition([{page:2,top:-200,bottom:800},{page:3,top:812,bottom:1812}],0,850),{page:2,offset:0.2});
});

test('FitR 矩形目录定位到矩形顶部，不静默跳到页首',async()=>{
 const doc={numPages:1,getPage:async()=>({getViewport:()=>({height:800,convertToViewportPoint:(x,y)=>[x,800-y]})})};
 assert.deepEqual(await resolveDestination(doc,[0,{name:'FitR'},100,100,400,600]),{page:1,offset:0.25});
});

test('升级后直接读取旧 v1 书签，读取不重写已有数据',()=>{
 const raw='{"version":1,"bookmarks":[{"id":"existing-bookmark","page":69,"offset":0.25,"label":"原有阅读位置","createdAt":"2026-10-20T04:00:00.000Z"}]}';
 let writes=0;
 const storage={getItem:key=>key==='dsh-pdf-bookmarks:v1:existing-document'?raw:null,setItem:()=>writes++};
 assert.deepEqual(createBookmarkStore(storage,'existing-document').list(),[{id:'existing-bookmark',page:69,offset:0.25,label:'原有阅读位置',createdAt:'2026-10-20T04:00:00.000Z'}]);
 assert.equal(writes,0);
});
