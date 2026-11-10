# Changelog

## 0.1.0 — react-markedit initial package release

- Publishable package name `react-markedit`, English installation/API documentation, and public package metadata.
- Version-derived build artifacts, release manifests, license/file checks, and tested-artifact integrity enforcement.
- Tag-driven npm trusted publishing and GitHub Release workflow; first publish uses the maintainer’s local npm login.
- Documented the upstream math-parser KaTeX advisory and application-level override.

## Unreleased — Performance foundations

- Reuse committed preview headings through `MarkdownPreview.onHeadings`, avoiding duplicate workspace parsing.
- Load Markdown editing without eager embedded HTML/CSS/JavaScript parsers. Default HTML tag completion is removed; host extensions remain supported.
- Add production browser latency/long-task measurements and initial bundle module reports.
- Enforce a 320 KB initial gzip JavaScript budget in CI; record measured before/after results.
- Cover outline metadata, desktop list continuation, undo, simulated URL paste, and responsive outline navigation.

## Unreleased — English interface

- English defaults across the workspace, reusable editor, insertion dialogs, accessibility labels, errors, and consumer example.
- Centralized English message catalogs, localized counts, and new-document templates; existing content is preserved.
- English READMEs and refreshed screenshots.
- Case-insensitive command search and browser-language-independent defaults.
- Package verification now follows shared JS chunks.
- Added localization coverage; 53 unit tests and 28 browser tests pass.

## Unreleased — P5 发布准备

- 采用 MIT 许可，组件 tarball 包含许可证；增加 Vercel 静态演示配置。
- 修复命令菜单 Enter 执行后因默认按键行为再次打开的问题。

- GitHub Actions 校验流程：格式、类型、单元测试、工作台与组件包构建、独立 tarball 消费、跨浏览器 E2E。
- Chromium、Firefox、WebKit 与移动视口测试配置；中文保存/下载、备份往返、键盘对话框、公式图表、组件契约流程。
- 架构说明、贡献指南、发布检查表、版本记录与可提交的真实截图。
- 发布报告记录构建文件大小、tarball 摘要、消费包一致性和已解析生产依赖许可清单。

本版本未公开发布；阶段状态与已知限制见[开发路线图](project/ROADMAP.md)。

## 0.1.0 — 本地开发里程碑

### P4 · 可复用组件

React 19 编辑器/预览 API、受控与非受控、只读、扩展、ref 命令、样式作用域、独立消费示例。

### P3 · Markdown 扩展

KaTeX、Mermaid、语言高亮、滚动同步、插入面板、图片回调与长文性能记录。

### P2 · 个人工作台

IndexedDB 多文档、目录、版本快照、回收站、跨标签同步和备份恢复。

### P1 · 基础编辑

React/TypeScript/Vite、CodeMirror 6、GFM 预览、主题与视图切换、单草稿保存、Markdown 导入导出和 Prettier。
