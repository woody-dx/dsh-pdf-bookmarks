import {createViewer} from './viewer.js';
export const inject = ['slots', 'documentPreviews'];
export function apply(ctx, loadEngine) {
 let removeDefinition, removeSlot;
 const fallback = () => {
  const cleanups=[removeDefinition,removeSlot];removeDefinition=removeSlot=undefined;
  for(const cleanup of cleanups)try {cleanup?.()} catch(error) {console.warn('[dsh-pdf-bookmarks] 回退失败',error)}
 };
 try {
  if(typeof ctx?.effect!=='function'||typeof ctx.slots?.inject!=='function'||typeof ctx.slots?.register!=='function'||typeof ctx.documentPreviews?.register!=='function')throw new Error('缺少 PDF 预览所需接口');
  const Viewer=createViewer(loadEngine,fallback);
  ctx.effect(()=>ctx.slots.inject('sidebar.right.tab.document',function*(){
   try {
    removeSlot=ctx.slots.register({name:'sidebar.right.tab.document',key:'dsh-pdf-bookmarks/pdf'},Viewer);
    removeDefinition=ctx.documentPreviews.register({id:'dsh-pdf-bookmarks/pdf',extensions:['pdf'],binaryExtensions:['pdf'],priority:'extension',title:()=> 'PDF 书签',loading:'bytes-complete',wrap:false});
    yield fallback;
   } catch(error) {fallback();console.warn('[dsh-pdf-bookmarks] 接口不适配，保留内置预览',error)}
  }));
 } catch(error) {fallback();console.warn('[dsh-pdf-bookmarks] 插件未启用，保留内置预览',error)}
}
