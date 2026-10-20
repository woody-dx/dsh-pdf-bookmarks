import {createViewer} from './viewer.js';
export const inject = ['slots', 'documentPreviews'];
export function apply(ctx, loadEngine) {
 let removeDefinition;
 const fallback = () => {try {removeDefinition?.();removeDefinition=undefined} catch(error) {console.warn('[dsh-pdf-bookmarks] 回退失败',error)}};
 const Viewer=createViewer(loadEngine,fallback);
 try {
  ctx.effect(()=>ctx.slots.inject('sidebar.right.tab.document',function*(){
   try {
    yield ctx.slots.register({name:'sidebar.right.tab.document',key:'dsh-pdf-bookmarks/pdf'},Viewer);
    removeDefinition=ctx.documentPreviews.register({id:'dsh-pdf-bookmarks/pdf',extensions:['pdf'],binaryExtensions:['pdf'],priority:'extension',title:()=> 'PDF 书签',loading:'bytes-complete',wrap:false});
    yield fallback;
   } catch(error) {fallback();console.warn('[dsh-pdf-bookmarks] 接口不适配，保留内置预览',error)}
  }));
 } catch(error) {fallback();console.warn('[dsh-pdf-bookmarks] 插件未启用，保留内置预览',error)}
}
