// dsh-pdf-bookmarks: small, exception-isolated entry; PDF engine loads only when used.
try { window.__ModuleLoader__?.load({id:'dsh-pdf-bookmarks',factory:(require)=>{try {const module={exports:{}};const exports=module.exports;
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client.js
var client_exports = {};
__export(client_exports, {
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(client_exports);

// src/viewer.js
var import_react = __toESM(require("react"), 1);

// src/core.js
function createBookmarkStore(storage, documentKey2) {
  const key = `dsh-pdf-bookmarks:v1:${documentKey2}`;
  const read = () => {
    const raw = storage.getItem(key);
    if (raw === null) return [];
    const parsed = JSON.parse(raw);
    if (parsed?.version !== 1 || !Array.isArray(parsed.bookmarks)) throw new Error("\u4E66\u7B7E\u6570\u636E\u7248\u672C\u4E0D\u652F\u6301\uFF0C\u539F\u6570\u636E\u5DF2\u4FDD\u7559");
    for (const item of parsed.bookmarks) validate(item, true);
    return parsed.bookmarks;
  };
  const write = (items) => storage.setItem(key, JSON.stringify({ version: 1, bookmarks: items }));
  return {
    list: read,
    add(value) {
      validate(value);
      const items = read();
      const item = { ...value, label: value.label.trim(), id: crypto.randomUUID(), createdAt: (/* @__PURE__ */ new Date()).toISOString() };
      write([...items, item]);
      return item;
    },
    rename(id, label) {
      if (typeof label !== "string" || !label.trim()) throw new Error("\u8BF7\u8F93\u5165\u4E66\u7B7E\u540D\u79F0");
      write(read().map((item) => item.id === id ? { ...item, label: label.trim() } : item));
    },
    remove(id) {
      write(read().filter((item) => item.id !== id));
    }
  };
}
function validate(value, stored = false) {
  if (!value || !Number.isInteger(value.page) || value.page < 1 || !Number.isFinite(value.offset) || value.offset < 0 || value.offset > 1 || typeof value.label !== "string" || !value.label.trim() || stored && typeof value.id !== "string") throw new Error("\u4E66\u7B7E\u6570\u636E\u65E0\u6548\uFF0C\u539F\u6570\u636E\u5DF2\u4FDD\u7559");
}
async function documentKey(bytes) {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
async function resolveDestination(document2, destination) {
  const target = typeof destination === "string" ? await document2.getDestination(destination) : destination;
  if (!Array.isArray(target) || target.length < 2) throw new Error("\u6B64\u76EE\u5F55\u9879\u6CA1\u6709\u6709\u6548\u7684\u6587\u6863\u5185\u4F4D\u7F6E");
  const index = Number.isInteger(target[0]) ? target[0] : await document2.getPageIndex(target[0]);
  if (!Number.isInteger(index) || index < 0 || index >= document2.numPages) throw new Error("\u76EE\u5F55\u76EE\u6807\u8D85\u51FA\u6587\u6863\u9875\u6570");
  const page = index + 1, mode = target[1]?.name;
  const y = mode === "XYZ" ? target[3] : mode === "FitR" ? target[5] : ["FitH", "FitBH"].includes(mode) ? target[2] : null;
  let offset = 0;
  if (Number.isFinite(y)) {
    const viewport = (await document2.getPage(page)).getViewport({ scale: 1 });
    const point = viewport.convertToViewportPoint(Number.isFinite(target[2]) && mode === "XYZ" ? target[2] : 0, y);
    offset = Math.min(1, Math.max(0, point[1] / viewport.height));
  }
  return { page, offset };
}
function readingPosition(rects, top, bottom) {
  let selected, visible = 0;
  for (const rect of rects) {
    const overlap = Math.min(bottom, rect.bottom) - Math.max(top, rect.top);
    if (overlap > visible) {
      selected = rect;
      visible = overlap;
    }
  }
  return selected ? { page: selected.page, offset: Math.max(0, Math.min(1, (top - selected.top) / (selected.bottom - selected.top))) } : { page: 1, offset: 0 };
}

// src/viewer.css
var viewer_default = '.dpb-root{--dpb-bg:var(--dsw-alias-bg-primary,oklch(98% .004 250));--dpb-label:var(--dsw-alias-label-primary,oklch(24% .012 250));--dpb-muted:var(--dsw-alias-label-secondary,oklch(53% .012 250));--dpb-border:var(--dsw-alias-border-primary,oklch(87% .008 250));--dpb-accent:var(--dsw-alias-label-link,oklch(52% .18 264));display:flex;flex-direction:column;min-height:0;height:100%;width:100%;color:var(--dpb-label);background:var(--dpb-bg);font:12px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;white-space:normal}.dpb-root *{box-sizing:border-box}.dpb-root button,.dpb-root select,.dpb-root input{font:inherit;color:inherit;border:1px solid transparent;border-radius:5px;background:transparent}.dpb-root button{cursor:pointer;padding:4px 7px;white-space:nowrap}.dpb-root button:hover,.dpb-root select:hover{background:color-mix(in oklch,var(--dpb-label) 7%,transparent)}.dpb-root button:disabled{opacity:.45;cursor:default}.dpb-root :is(button,select,input):focus-visible{outline:2px solid var(--dpb-accent);outline-offset:1px}.dpb-toolbar{display:flex;align-items:center;gap:6px;min-height:38px;padding:4px 8px;border-bottom:1px solid var(--dpb-border);flex:none}.dpb-spacer{flex:1}.dpb-pages{display:flex;align-items:center;gap:4px;font-variant-numeric:tabular-nums;white-space:nowrap;color:var(--dpb-muted)}.dpb-pages input{width:43px;padding:3px;text-align:center;border-color:var(--dpb-border);appearance:textfield}.dpb-pages input::-webkit-inner-spin-button{appearance:none}.dpb-toolbar select{max-width:100px;padding:3px}.dpb-content{flex:1;display:flex;position:relative;min-height:0;overflow:hidden}.dpb-nav{width:204px;flex:none;min-height:0;display:flex;flex-direction:column;border-right:1px solid var(--dpb-border);background:var(--dpb-bg);z-index:2}.dpb-narrow .dpb-nav{position:absolute;left:0;top:0;bottom:0;width:min(240px,82%);box-shadow:4px 0 16px color-mix(in oklch,var(--dpb-label) 12%,transparent)}.dpb-tabs{display:flex;gap:4px;padding:7px 8px;border-bottom:1px solid var(--dpb-border)}.dpb-tabs button{flex:1;color:var(--dpb-muted)}.dpb-tabs [aria-selected=true]{color:var(--dpb-label);font-weight:600;background:color-mix(in oklch,var(--dpb-label) 7%,transparent)}.dpb-nav-body{flex:1;overflow:auto;padding:6px 4px}.dpb-nav-footer{font-size:10px;color:var(--dpb-muted);border-top:1px solid var(--dpb-border);padding:8px 10px}.dpb-empty{color:var(--dpb-muted);padding:8px 10px;line-height:1.8;margin:0}.dpb-outline,.dpb-bookmarks{list-style:none;margin:0;padding:0}.dpb-outline .dpb-outline{padding-left:14px}.dpb-outline-row{display:flex;align-items:baseline;min-height:31px}.dpb-outline-row>button:first-child,.dpb-tree-spacer{width:23px;flex:none;padding-inline:2px}.dpb-root .dpb-outline-link{min-width:0;flex:1;text-align:left;white-space:normal;overflow-wrap:anywhere;padding:5px 4px;line-height:1.6}.dpb-bookmarks li{display:flex;align-items:center;gap:1px;border-bottom:1px solid color-mix(in oklch,var(--dpb-border) 50%,transparent)}.dpb-root .dpb-bookmark-link{min-width:0;flex:1;display:flex;flex-direction:column;align-items:flex-start;text-align:left;padding:7px;white-space:normal;overflow-wrap:anywhere}.dpb-bookmark-link small{font-size:10px;color:var(--dpb-muted);margin-top:2px}.dpb-name{display:flex;flex-wrap:wrap;gap:4px;padding:7px;width:100%}.dpb-name input{width:100%;padding:5px;border-color:var(--dpb-border)}.dpb-name button{border-color:var(--dpb-border)}.dpb-scroll{flex:1;min-width:0;min-height:0;overflow:auto;background:var(--dsw-alias-bg-document-preview,oklch(92% .008 250));overflow-anchor:none}.dpb-paper-list{display:flex;align-items:center;flex-direction:column;gap:12px;width:max-content;min-width:100%;padding:12px}.dpb-page{position:relative;flex:none;background:oklch(99.7% .001 250);box-shadow:0 1px 5px oklch(20% .01 250/.15);overflow:hidden}.dpb-page canvas{display:block;width:100%;height:100%}.dpb-status{padding:24px;display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:10px;flex:1;color:var(--dpb-muted)}.dpb-status p{width:100%;text-align:center;overflow-wrap:anywhere}.dpb-status button{border-color:var(--dpb-border)}.dpb-notice{display:flex;justify-content:space-between;align-items:center;padding:6px 10px;color:var(--dpb-muted);border-bottom:1px solid var(--dpb-border);overflow-wrap:anywhere}.dpb-page-error{position:absolute;inset:0;padding:20px;color:var(--dpb-muted)}\n@media(prefers-color-scheme:dark){.dpb-root{--dpb-bg:var(--dsw-alias-bg-primary,oklch(24% .012 250));--dpb-label:var(--dsw-alias-label-primary,oklch(91% .006 250));--dpb-muted:var(--dsw-alias-label-secondary,oklch(70% .012 250));--dpb-border:var(--dsw-alias-border-primary,oklch(37% .014 250))}.dpb-scroll{background:var(--dsw-alias-bg-document-preview,oklch(18% .01 250))}}\n';

// src/viewer.js
var h = import_react.default.createElement;
var describe = (error) => error instanceof Error ? error.message : String(error);
function Button({ children, title, ...props }) {
  return h("button", { type: "button", title, ...props }, children);
}
function createViewer(loadEngine, fallback) {
  class Boundary extends import_react.default.Component {
    state = { failed: false };
    static getDerivedStateFromError() {
      return { failed: true };
    }
    componentDidCatch(error) {
      console.warn("[dsh-pdf-bookmarks] \u9884\u89C8\u5DF2\u9694\u79BB", error);
    }
    render() {
      return this.state.failed ? h("div", { className: "dpb-status", role: "alert" }, "\u589E\u5F3A\u9884\u89C8\u6682\u4E0D\u53EF\u7528\u3002", h(Button, { onClick: fallback }, "\u4F7F\u7528\u5185\u7F6E PDF \u9884\u89C8")) : this.props.children;
    }
  }
  return function SafeViewer(props) {
    return h(Boundary, { key: props.resourceAddress }, h(Viewer, { ...props, loadEngine, fallback }));
  };
}
function Viewer({ content, resourceAddress, scrollportRef, useTabInfo, loadEngine, fallback }) {
  const { tab } = useTabInfo();
  const root = (0, import_react.useRef)(null), scroll = (0, import_react.useRef)(null), pending = (0, import_react.useRef)(null), frame = (0, import_react.useRef)(0);
  const [loaded, setLoaded] = (0, import_react.useState)(null), [error, setError] = (0, import_react.useState)(""), [notice, setNotice] = (0, import_react.useState)("");
  const [outline, setOutline] = (0, import_react.useState)(null), [store, setStore] = (0, import_react.useState)(null), [bookmarks, setBookmarks] = (0, import_react.useState)([]);
  const [open, setOpen] = (0, import_react.useState)(true), [section, setSection] = (0, import_react.useState)("outline"), [current, setCurrent] = (0, import_react.useState)(1);
  const [zoom, setZoom] = (0, import_react.useState)("fit"), [width, setWidth] = (0, import_react.useState)(600), [narrow, setNarrow] = (0, import_react.useState)(false);
  const [editing, setEditing] = (0, import_react.useState)(null), [attempt, setAttempt] = (0, import_react.useState)(0);
  const bytes = content.kind === "bytes" ? content.data : null;
  (0, import_react.useEffect)(() => {
    const controller = new AbortController();
    let session;
    const signal = tab?.signal ? AbortSignal.any([controller.signal, tab.signal]) : controller.signal;
    setLoaded(null);
    setOutline(null);
    setStore(null);
    setBookmarks([]);
    setError("");
    setNotice("");
    setCurrent(1);
    pending.current = null;
    if (bytes) (async () => {
      let engine;
      try {
        engine = await loadEngine();
      } catch (err) {
        console.warn("[dsh-pdf-bookmarks] \u5F15\u64CE\u4E0D\u53EF\u7528\uFF0C\u56DE\u9000\u5185\u7F6E\u9884\u89C8", err);
        if (!signal.aborted) fallback();
        return;
      }
      signal.throwIfAborted();
      session = engine.openPdf(bytes, signal, (err) => {
        if (!signal.aborted) setError("PDF \u6E32\u67D3\u8FDB\u7A0B\u5F02\u5E38\uFF0C\u8BF7\u91CD\u8BD5\u6216\u4F7F\u7528\u5185\u7F6E\u9884\u89C8");
      });
      const [document2, key] = await Promise.all([session.document, documentKey(bytes)]);
      signal.throwIfAborted();
      const page = await document2.getPage(1), viewport = page.getViewport({ scale: 96 / 72 });
      signal.throwIfAborted();
      setLoaded({ document: document2, engine, base: { width: viewport.width, height: viewport.height } });
      try {
        const next = createBookmarkStore(window.localStorage, key);
        const saved = next.list();
        if (!signal.aborted) {
          setStore(next);
          setBookmarks(saved);
        }
      } catch (err) {
        if (!signal.aborted) setNotice("\u65E0\u6CD5\u8BFB\u53D6\u672C\u5730\u4E66\u7B7E\uFF0C\u539F\u6570\u636E\u5DF2\u4FDD\u7559\uFF1A" + describe(err));
      }
      try {
        const items = await document2.getOutline();
        if (!signal.aborted) setOutline(items || []);
      } catch (err) {
        if (!signal.aborted) {
          setOutline([]);
          setNotice("\u6587\u6863\u76EE\u5F55\u8BFB\u53D6\u5931\u8D25\uFF0C\u4ECD\u53EF\u4F7F\u7528\u4E2A\u4EBA\u4E66\u7B7E\uFF1A" + describe(err));
        }
      }
    })().catch((err) => {
      if (!signal.aborted) setError(err?.name === "PasswordException" ? "\u6B64 PDF \u9700\u8981\u5BC6\u7801\uFF0C\u8BF7\u4F7F\u7528\u5176\u4ED6\u67E5\u770B\u5668\u6253\u5F00" : describe(err));
    });
    return () => {
      controller.abort();
      session?.dispose();
    };
  }, [bytes, tab?.signal, attempt, loadEngine, fallback]);
  (0, import_react.useEffect)(() => {
    const node = root.current;
    if (!node) return;
    const observer = new ResizeObserver(() => setNarrow(node.clientWidth < 640));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  const bindScroll = (0, import_react.useCallback)((node) => {
    scroll.current = node;
    if (typeof scrollportRef === "function") scrollportRef(node);
    else if (scrollportRef) scrollportRef.current = node;
  }, [scrollportRef]);
  (0, import_react.useEffect)(() => {
    const node = scroll.current;
    if (!node) return;
    const observer = new ResizeObserver(() => setWidth(Math.max(120, node.clientWidth - 24)));
    observer.observe(node);
    return () => observer.disconnect();
  }, [loaded, open, narrow]);
  (0, import_react.useEffect)(() => () => cancelAnimationFrame(frame.current), []);
  const scale = zoom === "fit" ? width / (loaded?.base.width || 800) : Number(zoom);
  const measure = (0, import_react.useCallback)(() => {
    const node = scroll.current;
    if (!node) return { page: current, offset: 0 };
    const viewport = node.getBoundingClientRect();
    return readingPosition(Array.from(node.querySelectorAll("[data-bookmark-page]"), (item) => {
      const rect = item.getBoundingClientRect();
      return { page: Number(item.dataset.bookmarkPage), top: rect.top, bottom: rect.bottom };
    }), viewport.top, viewport.bottom);
  }, [current, loaded]);
  const onScroll = (0, import_react.useCallback)(() => {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => setCurrent(measure().page));
  }, [measure]);
  const jump = (0, import_react.useCallback)((position, close = true) => {
    if (!loaded || !Number.isInteger(position.page) || position.page < 1 || position.page > loaded.document.numPages) {
      setNotice("\u4E66\u7B7E\u76EE\u6807\u8D85\u51FA\u5F53\u524D\u6587\u6863\u9875\u6570");
      return;
    }
    const node = scroll.current, target = node?.querySelector(`[data-bookmark-page="${position.page}"]`);
    if (!target) return;
    pending.current = position;
    node.scrollTo({ top: node.scrollTop + target.getBoundingClientRect().top - node.getBoundingClientRect().top + target.getBoundingClientRect().height * position.offset, behavior: "instant" });
    setCurrent(position.page);
    if (close && narrow) setOpen(false);
  }, [loaded, narrow]);
  const pageReady = (0, import_react.useCallback)((page) => {
    if (pending.current?.page !== page) return;
    requestAnimationFrame(() => {
      if (pending.current?.page === page) {
        jump(pending.current, false);
        pending.current = null;
      }
    });
  }, [jump]);
  (0, import_react.useLayoutEffect)(() => {
    if (pending.current && loaded) jump(pending.current, false);
  }, [scale]);
  const visit = async (destination) => {
    try {
      jump(await resolveDestination(loaded.document, destination));
      setNotice("");
    } catch (err) {
      setNotice(describe(err));
    }
  };
  const mutate = (operation) => {
    try {
      operation();
      setBookmarks(store.list());
      setNotice("");
    } catch (err) {
      setNotice("\u4E66\u7B7E\u672A\u4FDD\u5B58\uFF1A" + describe(err));
    }
  };
  const add = () => {
    if (!store) return;
    mutate(() => {
      const position = measure();
      const item = store.add({ ...position, label: `\u7B2C ${position.page} \u9875` });
      setEditing(item.id);
      setSection("mine");
      setOpen(true);
    });
  };
  const refresh = () => {
    try {
      setBookmarks(store.list());
    } catch (err) {
      setNotice("\u4E66\u7B7E\u8BFB\u53D6\u5931\u8D25\uFF1A" + describe(err));
    }
  };
  (0, import_react.useEffect)(() => {
    if (!store) return;
    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, [store]);
  return h(
    "div",
    { className: "dpb-root", ref: root, "data-pdf-bookmarks": true },
    h("style", null, viewer_default),
    h(
      "div",
      { className: "dpb-toolbar", role: "toolbar", "aria-label": "PDF \u9605\u8BFB\u5DE5\u5177" },
      h(Button, { "aria-expanded": open, "aria-label": "\u5207\u6362\u4E66\u7B7E\u5BFC\u822A", onClick: () => setOpen(!open), title: "\u76EE\u5F55\u548C\u4E66\u7B7E" }, "\u2630"),
      h("span", { className: "dpb-pages" }, loaded ? h("input", { "aria-label": "\u5F53\u524D\u9875", type: "number", min: 1, max: loaded.document.numPages, value: current, onChange: (event) => {
        const page = Number(event.target.value);
        if (page >= 1 && page <= loaded.document.numPages) jump({ page, offset: 0 }, false);
      } }) : "\u2026", loaded && ` / ${loaded.document.numPages}`),
      h("span", { className: "dpb-spacer" }),
      h("select", { "aria-label": "\u7F29\u653E\u6BD4\u4F8B", value: zoom, onChange: (event) => {
        pending.current = measure();
        setZoom(event.target.value);
      } }, h("option", { value: "fit" }, "\u9002\u5E94\u5BBD\u5EA6"), ...[0.5, 0.75, 1, 1.25, 1.5, 2].map((value) => h("option", { key: value, value }, `${value * 100}%`))),
      h(Button, { onClick: add, disabled: !store, "aria-label": "\u6DFB\u52A0\u5F53\u524D\u9605\u8BFB\u4F4D\u7F6E\u4E3A\u4E66\u7B7E", title: "\u6DFB\u52A0\u4E66\u7B7E" }, "\u2606 \u4E66\u7B7E")
    ),
    notice && h("div", { className: "dpb-notice", role: "status" }, notice, h(Button, { onClick: () => setNotice(""), "aria-label": "\u5173\u95ED\u63D0\u793A" }, "\xD7")),
    error ? h("div", { className: "dpb-status", role: "alert" }, h("p", null, error), h(Button, { onClick: () => setAttempt(attempt + 1) }, "\u91CD\u8BD5"), h(Button, { onClick: fallback }, "\u4F7F\u7528\u5185\u7F6E PDF \u9884\u89C8")) : !loaded ? h("div", { className: "dpb-status", role: "status" }, "\u6B63\u5728\u6253\u5F00 PDF\u2026") : h(
      "div",
      { className: "dpb-content" + (narrow ? " dpb-narrow" : "") },
      open && h(
        "nav",
        { className: "dpb-nav", "aria-label": "PDF \u4E66\u7B7E\u5BFC\u822A" },
        h(
          "div",
          { className: "dpb-tabs", role: "tablist", "aria-label": "\u5BFC\u822A\u7C7B\u578B" },
          h(Button, { role: "tab", "aria-selected": section === "outline", onClick: () => setSection("outline") }, "\u6587\u6863\u76EE\u5F55"),
          h(Button, { role: "tab", "aria-selected": section === "mine", onClick: () => setSection("mine") }, "\u6211\u7684\u4E66\u7B7E")
        ),
        h("div", { className: "dpb-nav-body" }, section === "outline" ? outline === null ? h("p", { className: "dpb-empty" }, "\u6B63\u5728\u8BFB\u53D6\u76EE\u5F55\u2026") : outline.length ? h(Outline, { items: outline, visit }) : h("p", { className: "dpb-empty" }, "\u6B64 PDF \u6CA1\u6709\u5185\u7F6E\u76EE\u5F55\u3002\u53EF\u5728\u201C\u6211\u7684\u4E66\u7B7E\u201D\u4E2D\u6DFB\u52A0\u9605\u8BFB\u4F4D\u7F6E\u3002") : bookmarks.length ? h("ul", { className: "dpb-bookmarks" }, bookmarks.map((item) => h("li", { key: item.id }, editing === item.id ? h(BookmarkName, { item, save: (label) => {
          mutate(() => store.rename(item.id, label));
          setEditing(null);
        }, cancel: () => setEditing(null) }) : h(
          import_react.default.Fragment,
          null,
          h(Button, { className: "dpb-bookmark-link", onClick: () => jump(item), title: item.label }, h("span", null, item.label), h("small", null, `\u7B2C ${item.page} \u9875`)),
          h(Button, { "aria-label": `\u91CD\u547D\u540D\u4E66\u7B7E ${item.label}`, onClick: () => setEditing(item.id), title: "\u91CD\u547D\u540D" }, "\u270E"),
          h(Button, { "aria-label": `\u5220\u9664\u4E66\u7B7E ${item.label}`, onClick: () => mutate(() => store.remove(item.id)), title: "\u5220\u9664\u4E66\u7B7E" }, "\xD7")
        )))) : h("p", { className: "dpb-empty" }, store ? "\u8FD8\u6CA1\u6709\u9605\u8BFB\u4E66\u7B7E\u3002\u70B9\u51FB\u5DE5\u5177\u680F\u201C\u2606 \u4E66\u7B7E\u201D\u6536\u85CF\u5F53\u524D\u4F4D\u7F6E\u3002" : "\u672C\u5730\u4E66\u7B7E\u6682\u4E0D\u53EF\u7528\uFF0C\u4ECD\u53EF\u9605\u8BFB\u6587\u6863\u548C\u4F7F\u7528\u76EE\u5F55\u3002")),
        h("div", { className: "dpb-nav-footer" }, "\u4E66\u7B7E\u4FDD\u5B58\u5728\u672C\u673A\uFF0CPDF \u539F\u6587\u4EF6\u4E0D\u53D8")
      ),
      h(
        "div",
        { className: "dpb-scroll", ref: bindScroll, onScroll, onWheel: () => {
          pending.current = null;
        }, "aria-label": "PDF \u6587\u6863\u9875\u9762", tabIndex: 0 },
        h("div", { className: "dpb-paper-list" }, Array.from({ length: loaded.document.numPages }, (_, index) => h(Page, { key: index, loaded, page: index + 1, scale, base: loaded.base, requested: current === index + 1, ready: pageReady })))
      )
    )
  );
}
function Outline({ items, visit }) {
  return h("ul", { className: "dpb-outline" }, items.map((item, index) => h(OutlineItem, { key: index, item, visit })));
}
function OutlineItem({ item, visit }) {
  const [expanded, setExpanded] = (0, import_react.useState)(true), children = item.items?.length > 0;
  return h(
    "li",
    null,
    h(
      "div",
      { className: "dpb-outline-row" },
      children ? h(Button, { "aria-label": `${expanded ? "\u6536\u8D77" : "\u5C55\u5F00"} ${item.title}`, "aria-expanded": expanded, onClick: () => setExpanded(!expanded) }, expanded ? "\u2304" : "\u203A") : h("span", { className: "dpb-tree-spacer" }),
      h(Button, { className: "dpb-outline-link", disabled: !item.dest, title: item.dest ? item.title : "\u6B64\u9879\u6CA1\u6709\u6587\u6863\u5185\u8DF3\u8F6C\u76EE\u6807", onClick: () => visit(item.dest) }, item.title || "\u672A\u547D\u540D\u7AE0\u8282")
    ),
    children && expanded && h(Outline, { items: item.items, visit })
  );
}
function BookmarkName({ item, save, cancel }) {
  const [value, setValue] = (0, import_react.useState)(item.label), input = (0, import_react.useRef)(null);
  (0, import_react.useEffect)(() => {
    input.current?.focus();
    input.current?.select();
  }, []);
  return h(
    "form",
    { className: "dpb-name", onSubmit: (event) => {
      event.preventDefault();
      if (value.trim()) save(value);
    } },
    h("input", { ref: input, "aria-label": "\u4E66\u7B7E\u540D\u79F0", value, maxLength: 200, onChange: (event) => setValue(event.target.value), onKeyDown: (event) => {
      if (event.key === "Escape") cancel();
    } }),
    h(Button, { type: "submit", disabled: !value.trim() }, "\u4FDD\u5B58"),
    h(Button, { onClick: cancel, "aria-label": "\u53D6\u6D88\u4FEE\u6539\u4E66\u7B7E" }, "\u53D6\u6D88")
  );
}
function Page({ loaded, page, scale, base, requested, ready }) {
  const host = (0, import_react.useRef)(null), canvas = (0, import_react.useRef)(null), text = (0, import_react.useRef)(null), queue = (0, import_react.useRef)(Promise.resolve());
  const [visible, setVisible] = (0, import_react.useState)(page === 1), [size, setSize] = (0, import_react.useState)(base), [failed, setFailed] = (0, import_react.useState)("");
  (0, import_react.useEffect)(() => {
    const observer = new IntersectionObserver((entries) => setVisible(entries.some((item) => item.isIntersecting)), { root: host.current.closest(".dpb-scroll"), rootMargin: "100% 0px" });
    observer.observe(host.current);
    return () => observer.disconnect();
  }, []);
  (0, import_react.useEffect)(() => {
    if (!visible && !requested) {
      if (canvas.current) canvas.current.width = canvas.current.height = 0;
      return;
    }
    const controller = new AbortController();
    let textTask;
    queue.current = queue.current.catch(() => {
    }).then(async () => {
      controller.signal.throwIfAborted();
      const buffer = document.createElement("canvas");
      try {
        const dimensions = await loaded.engine.renderPdfPage(loaded.document, page, buffer, controller.signal, devicePixelRatio * scale, (pdfPage, viewport) => {
          textTask = loaded.engine.pdfTextRenderer(text.current)(pdfPage, viewport);
          return textTask;
        });
        controller.signal.throwIfAborted();
        const target = canvas.current;
        target.width = buffer.width;
        target.height = buffer.height;
        target.getContext("2d").drawImage(buffer, 0, 0);
        setSize(dimensions);
        setFailed("");
        ready(page);
      } finally {
        buffer.width = buffer.height = 0;
      }
    }).catch((err) => {
      if (!controller.signal.aborted) setFailed(describe(err));
    });
    return () => {
      controller.abort();
      textTask?.cancel();
    };
  }, [loaded, page, visible, requested, scale]);
  return h(
    "section",
    { ref: host, className: "dpb-page", "data-bookmark-page": page, style: { width: size.width * scale, height: size.height * scale }, "aria-label": `\u7B2C ${page} \u9875` },
    h("canvas", { ref: canvas, "aria-label": `PDF \u7B2C ${page} \u9875` }),
    h("div", { ref: text, className: loaded.engine.textClass }),
    failed && h("div", { className: "dpb-page-error", role: "alert" }, "\u6B64\u9875\u6E32\u67D3\u5931\u8D25\uFF1A" + failed)
  );
}

// src/client.js
var inject = ["slots", "documentPreviews"];
function apply(ctx, loadEngine) {
  let removeDefinition;
  const fallback = () => {
    try {
      removeDefinition?.();
      removeDefinition = void 0;
    } catch (error) {
      console.warn("[dsh-pdf-bookmarks] \u56DE\u9000\u5931\u8D25", error);
    }
  };
  const Viewer2 = createViewer(loadEngine, fallback);
  try {
    ctx.effect(() => ctx.slots.inject("sidebar.right.tab.document", function* () {
      try {
        yield ctx.slots.register({ name: "sidebar.right.tab.document", key: "dsh-pdf-bookmarks/pdf" }, Viewer2);
        removeDefinition = ctx.documentPreviews.register({ id: "dsh-pdf-bookmarks/pdf", extensions: ["pdf"], binaryExtensions: ["pdf"], priority: "extension", title: () => "PDF \u4E66\u7B7E", loading: "bytes-complete", wrap: false });
        yield fallback;
      } catch (error) {
        fallback();
        console.warn("[dsh-pdf-bookmarks] \u63A5\u53E3\u4E0D\u9002\u914D\uFF0C\u4FDD\u7559\u5185\u7F6E\u9884\u89C8", error);
      }
    }));
  } catch (error) {
    fallback();
    console.warn("[dsh-pdf-bookmarks] \u63D2\u4EF6\u672A\u542F\u7528\uFF0C\u4FDD\u7559\u5185\u7F6E\u9884\u89C8", error);
  }
}

const plugin=module.exports;return {inject:plugin.inject,apply:ctx=>plugin.apply(ctx,()=>require.async('./client.engine.js'))};} catch(error){console.warn('[dsh-pdf-bookmarks] client disabled',error);return {apply(){}};}}}); } catch(error) { console.warn('[dsh-pdf-bookmarks] module registration skipped',error); }
