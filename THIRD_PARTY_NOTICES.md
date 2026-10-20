# 第三方代码与资源

本插件原创源码使用根目录的 MIT 许可证。下列第三方代码与资源保留各自许可，不能将整个分发包概括为只有 MIT。

- **DeepSeek Harness**：`vendor/client.pdf.js` 是 Desktop 0.2.1-rc.2 自带的 `@deepseek-ai/dsh-client-ui-sidebar-documentpreview` PDF 渲染产物快照。原始 MIT 许可证见 `licenses/DeepSeek-Harness-MIT.txt`；来源与 SHA-256 见 `vendor/source.json`。
- **PDF.js 6.3.289**：Apache-2.0。Worker、字体、字符映射等内嵌资源的完整版权和许可声明保留在 `vendor/client.pdf.js` 与安装包中的 `lib/client.engine.js` 文件头部；其中包含 Adobe/Foxit 等资源的再分发条件。
- **Liberation Sans 1.07.4**：GPLv2 与 Liberation 字体例外。相应完整 SFD 字体源码、构建脚本与许可证随仓库和安装包提供于 `licenses/liberation-fonts/`，来源、版本、校验值和构建说明见该目录的 `来源与构建.md`。未修改字体。

构建只调整渲染模块身份、样式归属与供本插件使用的低层导出，不删除第三方声明。React 与 react-dom 仅为开发依赖；运行时复用 dsh 平台的 React，不再安装一份 dsh 核心依赖。
