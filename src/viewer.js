import React, {useCallback, useEffect, useLayoutEffect, useRef, useState} from 'react';
import {createBookmarkStore, documentKey, resolveDestination, readingPosition} from './core.js';
import css from './viewer.css';
const h = React.createElement;
const describe = error => error instanceof Error ? error.message : String(error);
function Button({children, title, ...props}) {return h('button', {type:'button', title, ...props}, children)}

export function createViewer(loadEngine, fallback) {
 class Boundary extends React.Component {
  state = {failed:false};
  static getDerivedStateFromError() {return {failed:true}}
  componentDidCatch(error) {console.warn('[dsh-pdf-bookmarks] 预览已隔离', error)}
  render() {return this.state.failed ? h('div',{className:'dpb-status',role:'alert'},'增强预览暂不可用。',h(Button,{onClick:fallback},'使用内置 PDF 预览')) : this.props.children}
 }
 return function SafeViewer(props) {
  return h(Boundary,{key:props.resourceAddress},h(Viewer,{...props,loadEngine,fallback}));
 };
}
function Viewer({content, resourceAddress, scrollportRef, useTabInfo, loadEngine, fallback}) {
 const {tab} = useTabInfo();
 const root = useRef(null), scroll = useRef(null), pending = useRef(null), frame = useRef(0);
 const [loaded,setLoaded] = useState(null), [error,setError] = useState(''), [notice,setNotice] = useState('');
 const [outline,setOutline] = useState(null), [store,setStore] = useState(null), [bookmarks,setBookmarks] = useState([]);
 const [open,setOpen] = useState(true), [section,setSection] = useState('outline'), [current,setCurrent] = useState(1);
 const [zoom,setZoom] = useState('fit'), [width,setWidth] = useState(600), [narrow,setNarrow] = useState(false);
 const [editing,setEditing] = useState(null), [attempt,setAttempt] = useState(0);
 const bytes = content.kind === 'bytes' ? content.data : null;
 useEffect(() => {
  const controller=new AbortController();let session;
  const signal=tab?.signal ? AbortSignal.any([controller.signal,tab.signal]) : controller.signal;
  setLoaded(null);setOutline(null);setStore(null);setBookmarks([]);setError('');setNotice('');setCurrent(1);pending.current=null;
  if(bytes) (async()=>{
   let engine;
   try {engine=await loadEngine()} catch(err) {console.warn('[dsh-pdf-bookmarks] 引擎不可用，回退内置预览',err);if(!signal.aborted)fallback();return}
   signal.throwIfAborted();
   session=engine.openPdf(bytes,signal,err=>{if(!signal.aborted)setError('PDF 渲染进程异常，请重试或使用内置预览')});
   const [document,key]=await Promise.all([session.document,documentKey(bytes)]);
   signal.throwIfAborted();
   const page=await document.getPage(1), viewport=page.getViewport({scale:96/72});
   signal.throwIfAborted();setLoaded({document,engine,base:{width:viewport.width,height:viewport.height}});
   try {const next=createBookmarkStore(window.localStorage,key);const saved=next.list();if(!signal.aborted){setStore(next);setBookmarks(saved)}} catch(err) {if(!signal.aborted)setNotice('无法读取本地书签，原数据已保留：'+describe(err))}
   try {const items=await document.getOutline();if(!signal.aborted)setOutline(items||[])} catch(err) {if(!signal.aborted){setOutline([]);setNotice('文档目录读取失败，仍可使用个人书签：'+describe(err))}}
  })().catch(err=>{if(!signal.aborted)setError(err?.name==='PasswordException'?'此 PDF 需要密码，请使用其他查看器打开':describe(err))});
  return ()=>{controller.abort();session?.dispose()};
 },[bytes,tab?.signal,attempt,loadEngine,fallback]);
 useEffect(()=>{
  const node=root.current;if(!node)return;
  const observer=new ResizeObserver(()=>setNarrow(node.clientWidth<640));observer.observe(node);return ()=>observer.disconnect();
 },[]);
 const bindScroll=useCallback(node=>{scroll.current=node;if(typeof scrollportRef==='function')scrollportRef(node);else if(scrollportRef)scrollportRef.current=node},[scrollportRef]);
 useEffect(()=>{
  const node=scroll.current;if(!node)return;
  const observer=new ResizeObserver(()=>setWidth(Math.max(120,node.clientWidth-24)));observer.observe(node);return ()=>observer.disconnect();
 },[loaded,open,narrow]);
 useEffect(()=>()=>cancelAnimationFrame(frame.current),[]);
 const scale=zoom==='fit'?width/(loaded?.base.width||800):Number(zoom);
 const measure=useCallback(()=>{
  const node=scroll.current;if(!node)return {page:current,offset:0};
  const viewport=node.getBoundingClientRect();
  return readingPosition(Array.from(node.querySelectorAll('[data-bookmark-page]'),item=>{
   const rect=item.getBoundingClientRect();return {page:Number(item.dataset.bookmarkPage),top:rect.top,bottom:rect.bottom};
  }),viewport.top,viewport.bottom);
 },[current,loaded]);
 const onScroll=useCallback(()=>{
  cancelAnimationFrame(frame.current);frame.current=requestAnimationFrame(()=>setCurrent(measure().page));
 },[measure]);
 const jump=useCallback((position,close=true)=>{
  if(!loaded||!Number.isInteger(position.page)||position.page<1||position.page>loaded.document.numPages){setNotice('书签目标超出当前文档页数');return}
  const node=scroll.current, target=node?.querySelector(`[data-bookmark-page="${position.page}"]`);
  if(!target)return;
  pending.current=position;
  node.scrollTo({top:node.scrollTop+target.getBoundingClientRect().top-node.getBoundingClientRect().top+target.getBoundingClientRect().height*position.offset,behavior:'instant'});
  setCurrent(position.page);if(close&&narrow)setOpen(false);
 },[loaded,narrow]);
 const pageReady=useCallback(page=>{
  if(pending.current?.page!==page)return;
  requestAnimationFrame(()=>{if(pending.current?.page===page){jump(pending.current,false);pending.current=null}});
 },[jump]);
 useLayoutEffect(()=>{if(pending.current&&loaded)jump(pending.current,false)},[scale]);
 const visit=async destination=>{try{jump(await resolveDestination(loaded.document,destination));setNotice('')}catch(err){setNotice(describe(err))}};
 const mutate=operation=>{try{operation();setBookmarks(store.list());setNotice('')}catch(err){setNotice('书签未保存：'+describe(err))}};
 const add=()=>{if(!store)return;mutate(()=>{const position=measure();const item=store.add({...position,label:`第 ${position.page} 页`});setEditing(item.id);setSection('mine');setOpen(true)})};
 const refresh=()=>{try{setBookmarks(store.list())}catch(err){setNotice('书签读取失败：'+describe(err))}};
 useEffect(()=>{
  if(!store)return;window.addEventListener('storage',refresh);return ()=>window.removeEventListener('storage',refresh);
 },[store]);
 return h('div',{className:'dpb-root',ref:root,'data-pdf-bookmarks':true},
  h('style',null,css),
  h('div',{className:'dpb-toolbar',role:'toolbar','aria-label':'PDF 阅读工具'},
   h(Button,{'aria-expanded':open,'aria-label':'切换书签导航',onClick:()=>setOpen(!open),title:'目录和书签'},'☰'),
   h('span',{className:'dpb-pages'},loaded?h('input',{'aria-label':'当前页',type:'number',min:1,max:loaded.document.numPages,value:current,onChange:event=>{const page=Number(event.target.value);if(page>=1&&page<=loaded.document.numPages)jump({page,offset:0},false)}}):'…',loaded&&` / ${loaded.document.numPages}`),
   h('span',{className:'dpb-spacer'}),
   h('select',{'aria-label':'缩放比例',value:zoom,onChange:event=>{pending.current=measure();setZoom(event.target.value)}},h('option',{value:'fit'},'适应宽度'),...[0.5,0.75,1,1.25,1.5,2].map(value=>h('option',{key:value,value},`${value*100}%`))),
   h(Button,{onClick:add,disabled:!store,'aria-label':'添加当前阅读位置为书签',title:'添加书签'},'☆ 书签')),
  notice&&h('div',{className:'dpb-notice',role:'status'},notice,h(Button,{onClick:()=>setNotice(''),'aria-label':'关闭提示'},'×')),
  error?h('div',{className:'dpb-status',role:'alert'},h('p',null,error),h(Button,{onClick:()=>setAttempt(attempt+1)},'重试'),h(Button,{onClick:fallback},'使用内置 PDF 预览')):
  !loaded?h('div',{className:'dpb-status',role:'status'},'正在打开 PDF…'):
  h('div',{className:'dpb-content'+(narrow?' dpb-narrow':'')},
   open&&h('nav',{className:'dpb-nav','aria-label':'PDF 书签导航'},
    h('div',{className:'dpb-tabs',role:'tablist','aria-label':'导航类型'},
     h(Button,{role:'tab','aria-selected':section==='outline',onClick:()=>setSection('outline')},'文档目录'),
     h(Button,{role:'tab','aria-selected':section==='mine',onClick:()=>setSection('mine')},'我的书签')),
    h('div',{className:'dpb-nav-body'},section==='outline'?
     outline===null?h('p',{className:'dpb-empty'},'正在读取目录…'):outline.length?h(Outline,{items:outline,visit}):h('p',{className:'dpb-empty'},'此 PDF 没有内置目录。可在“我的书签”中添加阅读位置。'):
     bookmarks.length?h('ul',{className:'dpb-bookmarks'},bookmarks.map(item=>h('li',{key:item.id},editing===item.id?
      h(BookmarkName,{item,save:label=>{mutate(()=>store.rename(item.id,label));setEditing(null)},cancel:()=>setEditing(null)}):
      h(React.Fragment,null,h(Button,{className:'dpb-bookmark-link',onClick:()=>jump(item),title:item.label},h('span',null,item.label),h('small',null,`第 ${item.page} 页`)),
       h(Button,{'aria-label':`重命名书签 ${item.label}`,onClick:()=>setEditing(item.id),title:'重命名'},'✎'),
       h(Button,{'aria-label':`删除书签 ${item.label}`,onClick:()=>mutate(()=>store.remove(item.id)),title:'删除书签'},'×'))))):
     h('p',{className:'dpb-empty'},store?'还没有阅读书签。点击工具栏“☆ 书签”收藏当前位置。':'本地书签暂不可用，仍可阅读文档和使用目录。')),
    h('div',{className:'dpb-nav-footer'},'书签保存在本机，PDF 原文件不变')),
   h('div',{className:'dpb-scroll',ref:bindScroll,onScroll,onWheel:()=>{pending.current=null},'aria-label':'PDF 文档页面',tabIndex:0},
    h('div',{className:'dpb-paper-list'},Array.from({length:loaded.document.numPages},(_,index)=>h(Page,{key:index,loaded,page:index+1,scale,base:loaded.base,requested:current===index+1,ready:pageReady}))))));
}
function Outline({items,visit}) {
 return h('ul',{className:'dpb-outline'},items.map((item,index)=>h(OutlineItem,{key:index,item,visit})));
}
function OutlineItem({item,visit}) {
 const [expanded,setExpanded]=useState(true), children=item.items?.length>0;
 return h('li',null,h('div',{className:'dpb-outline-row'},children?h(Button,{'aria-label':`${expanded?'收起':'展开'} ${item.title}`,'aria-expanded':expanded,onClick:()=>setExpanded(!expanded)},expanded?'⌄':'›'):h('span',{className:'dpb-tree-spacer'}),
  h(Button,{className:'dpb-outline-link',disabled:!item.dest,title:item.dest?item.title:'此项没有文档内跳转目标',onClick:()=>visit(item.dest)},item.title||'未命名章节')),
  children&&expanded&&h(Outline,{items:item.items,visit}));
}
function BookmarkName({item,save,cancel}) {
 const [value,setValue]=useState(item.label),input=useRef(null);
 useEffect(()=>{input.current?.focus();input.current?.select()},[]);
 return h('form',{className:'dpb-name',onSubmit:event=>{event.preventDefault();if(value.trim())save(value)}},
  h('input',{ref:input,'aria-label':'书签名称',value,maxLength:200,onChange:event=>setValue(event.target.value),onKeyDown:event=>{if(event.key==='Escape')cancel()}}),
  h(Button,{type:'submit',disabled:!value.trim()},'保存'),h(Button,{onClick:cancel,'aria-label':'取消修改书签'},'取消'));
}
function Page({loaded,page,scale,base,requested,ready}) {
 const host=useRef(null),canvas=useRef(null),text=useRef(null),queue=useRef(Promise.resolve());
 const [visible,setVisible]=useState(page===1),[size,setSize]=useState(base),[failed,setFailed]=useState('');
 useEffect(()=>{
  const observer=new IntersectionObserver(entries=>setVisible(entries.some(item=>item.isIntersecting)),{root:host.current.closest('.dpb-scroll'),rootMargin:'100% 0px'});observer.observe(host.current);return ()=>observer.disconnect();
 },[]);
 useEffect(()=>{
  if(!visible&&!requested){if(canvas.current)canvas.current.width=canvas.current.height=0;return;}
  const controller=new AbortController();let textTask;
  queue.current=queue.current.catch(()=>{}).then(async()=>{
   controller.signal.throwIfAborted();
   const buffer=document.createElement('canvas');
   try {
    const dimensions=await loaded.engine.renderPdfPage(loaded.document,page,buffer,controller.signal,devicePixelRatio*scale,(pdfPage,viewport)=>{
     textTask=loaded.engine.pdfTextRenderer(text.current)(pdfPage,viewport);return textTask;
    });
    controller.signal.throwIfAborted();
    const target=canvas.current;target.width=buffer.width;target.height=buffer.height;target.getContext('2d').drawImage(buffer,0,0);
    setSize(dimensions);setFailed('');ready(page);
   } finally {buffer.width=buffer.height=0}
  }).catch(err=>{if(!controller.signal.aborted)setFailed(describe(err))});
  return ()=>{controller.abort();textTask?.cancel()};
 },[loaded,page,visible,requested,scale]);
 return h('section',{ref:host,className:'dpb-page','data-bookmark-page':page,style:{width:size.width*scale,height:size.height*scale},'aria-label':`第 ${page} 页`},
  h('canvas',{ref:canvas,'aria-label':`PDF 第 ${page} 页`}),h('div',{ref:text,className:loaded.engine.textClass}),
  failed&&h('div',{className:'dpb-page-error',role:'alert'},'此页渲染失败：'+failed));
}
