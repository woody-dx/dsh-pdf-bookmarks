/** 书签只保存导航元数据；写入成功后才返回新结果。 */
export function createBookmarkStore(storage, documentKey) {
 const key = `dsh-pdf-bookmarks:v1:${documentKey}`;
 const read = () => {
  const raw = storage.getItem(key);
  if (raw === null) return [];
  const parsed = JSON.parse(raw);
  if (parsed?.version !== 1 || !Array.isArray(parsed.bookmarks)) throw new Error('书签数据版本不支持，原数据已保留');
  for (const item of parsed.bookmarks) validate(item, true);
  return parsed.bookmarks;
 };
 const write = (items) => storage.setItem(key, JSON.stringify({version: 1, bookmarks: items}));
 return {
  list: read,
  add(value) {
   validate(value);
   const items = read();
   const item = {...value, label: value.label.trim(), id: crypto.randomUUID(), createdAt: new Date().toISOString()};
   write([...items, item]); return item;
  },
  rename(id, label) {
   if (typeof label !== 'string' || !label.trim()) throw new Error('请输入书签名称');
   write(read().map(item => item.id === id ? {...item, label: label.trim()} : item));
  },
  remove(id) { write(read().filter(item => item.id !== id)); }
 };
}
function validate(value, stored = false) {
 if (!value || !Number.isInteger(value.page) || value.page < 1 || !Number.isFinite(value.offset) || value.offset < 0 || value.offset > 1 || typeof value.label !== 'string' || !value.label.trim() || (stored && typeof value.id !== 'string')) throw new Error('书签数据无效，原数据已保留');
}
export async function documentKey(bytes) {
 const digest = await crypto.subtle.digest('SHA-256', bytes);
 return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}
/** PDF 目录的零起算索引或引用转换为阅读器的一起算页码。 */
export async function resolveDestination(document, destination) {
 const target = typeof destination === 'string' ? await document.getDestination(destination) : destination;
 if (!Array.isArray(target) || target.length < 2) throw new Error('此目录项没有有效的文档内位置');
 const index = Number.isInteger(target[0]) ? target[0] : await document.getPageIndex(target[0]);
 if (!Number.isInteger(index) || index < 0 || index >= document.numPages) throw new Error('目录目标超出文档页数');
 const page = index + 1, mode = target[1]?.name;
 const y = mode === 'XYZ' ? target[3] : mode === 'FitR' ? target[5] : ['FitH', 'FitBH'].includes(mode) ? target[2] : null;
 let offset = 0;
 if (Number.isFinite(y)) {
  const viewport = (await document.getPage(page)).getViewport({scale: 1});
  const point = viewport.convertToViewportPoint(Number.isFinite(target[2]) && mode === 'XYZ' ? target[2] : 0, y);
  offset = Math.min(1, Math.max(0, point[1] / viewport.height));
 }
 return {page, offset};
}

export function readingPosition(rects, top, bottom) {
 let selected, visible = 0;
 for (const rect of rects) {
  const overlap = Math.min(bottom,rect.bottom)-Math.max(top,rect.top);
  if (overlap > visible) {selected=rect;visible=overlap;}
 }
 return selected ? {page:selected.page,offset:Math.max(0,Math.min(1,(top-selected.top)/(selected.bottom-selected.top)))} : {page:1,offset:0};
}
