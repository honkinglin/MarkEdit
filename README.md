# MarkEdit

用 React 重写 Editor.md 核心体验的个人项目：一个安静、现代的 Markdown 写作空间，以及逐步演进的可复用编辑器组件。

## 本地运行

建议 Node.js 24 LTS，使用 npm 与提交的 lockfile。

```bash
npm ci
npm run dev
```

打开终端显示的本地地址。首次安装需要网络。

```bash
npm test       # 数据仓库、保存竞态、目录和预览安全回归测试
npm run build # TypeScript 检查与生产打包
npm run preview
```

代码格式统一使用 Prettier，配置见 `.prettierrc.json`：2 空格缩进、单引号、分号、100 字符行宽。构建产物和依赖锁文件不参与格式化。

```bash
npm run format       # 格式化整个项目
npm run format:check # 仅检查格式，适合提交前或 CI 使用
```

## 当前功能

- CodeMirror 6 源码编辑、搜索替换、撤销/重做。
- React Markdown + GFM 实时预览：表格、任务列表、删除线等。
- 选区格式工具栏；编辑/分屏/预览视图。
- 暖白/深色主题、中文 UI、响应式布局。
- IndexedDB 多文档管理：新建、重命名、标题/正文搜索、回收站与恢复。
- 旧版单草稿自动迁移，保留原始 localStorage 数据；自动保存与刷新恢复。
- AST 文档目录、唯一标题锚点、编辑器与预览标题跳转。
- 版本快照与恢复、跨标签页同步和冲突保护。
- 可调分屏、专注模式、命令菜单及主题偏好保存。
- Markdown 导入为新文档；JSON 批量备份含回收站与历史版本。
- 存储错误提示与损坏草稿保护；原始 HTML 默认不渲染。

当前仅保存到此浏览器，不是云备份。浏览器清理站点数据会删除文档，请定期备份。Markdown 导入创建新文档；工作台备份导入创建独立副本，不覆盖已有内容。首次启动需加载应用资源；此版本不包含离线 Service Worker。

## 常用操作

- 左侧文档库：新建、搜索、切换；顶部垃圾桶按钮将当前文档移入回收站。
- 目录按钮：显示标题导航；历史按钮：保存快照与恢复版本。
- `⌘/Ctrl + K`：打开命令菜单，包含全部备份、恢复入口和快捷键说明。
- `⌘/Ctrl + S`：立即保存；`Esc`：退出专注模式或关闭命令菜单。
- 分屏宽度滑块支持键盘方向键；窄屏改为纵向布局。

自动保存延迟 350ms；切换文档前会等待保存完成。写入失败时保留当前内容并阻止切换，可重试或导出。并发冲突时可载入最新版本或另存副本。自动历史间隔至少 30 秒，和手动快照共保留最近 30 份；恢复前会保存当前版本。

Markdown 导入限制 1 MB；工作台 JSON 备份导入限制 20 MB、1000 份文档。备份包含历史版本，应当像正文一样保管。

## 扩展语法与编辑体验（P3）

可导入 [扩展语法示例](examples/extended-markdown.md) 体验公式、流程图、时序图和代码高亮。

- 公式：行内 `$E=mc^2$`，独立段落使用 `$$` 包围公式；KaTeX 按需加载。
- 图表：使用 `mermaid` 围栏代码块；错误就地展示，不中断正文。旧 `flow` / `seq` 需手动迁移为 Mermaid；`[TOC]` 仍使用工作台目录替代。
- 高亮：按需加载 JavaScript、TypeScript、Python、JSON、CSS、HTML/XML、Bash、SQL、Markdown；未知语言和超过 100,000 字符的代码块显示纯文本。
- 工具栏新增链接、图片 URL、表格和代码语言面板；代码块支持复制。
- 分屏预览的“同步滚动”开关支持源码与预览双向定位，异步渲染后重新计算位置。

`MarkdownEditor` 接受可选的 `uploadImage(file): Promise<string>`，用于粘贴/拖拽图片。接入方负责上传并返回 HTTP(S) URL；客户端限制 PNG/JPEG/GIF/WebP、5 MB。当前工作台没有上传后端，只提供图片 URL 输入，尚未验收真实上传服务。

公式禁用可信命令并限制展开规模；Mermaid 使用 strict 模式、禁用内嵌配置及 HTML 标签，输出 SVG 再经 DOMPurify 清理。原始 HTML 仍不渲染。复杂图表可能受安全策略限制。

### 性能记录

超过 30,000 字符的文档合并 180ms 内的预览更新，源码输入与自动保存保持独立。运行 `npm run benchmark` 可生成 102,400 字节的中文测试文档与 `.benchmarks/report.json`；该目录不提交。

2026-11-09，Node 24.14.0 / macOS arm64，20 次热运行：目录解析中位数 19.11ms / P95 27.77ms；预览服务端渲染中位数 31.87ms / P95 33.60ms。此数据不包含浏览器布局、输入到绘制延迟、网络或异步图表渲染。

浏览器开发模式（StrictMode）对同一长文连续输入的 React 渲染记录约 7–11ms，停止输入后的整篇预览更新仍约 171ms；不是 60fps 或输入延迟保证。可使用开发地址 `?profile=1` 在控制台查看 React Profiler 记录。生产主包仍有大 chunk 警告，图表依赖虽按需加载但体积较大，后续继续优化。

## React 组件包（P4）

编辑器和预览的实现已移入 `packages/editor`，工作台通过薄适配层复用；存储、文档管理和导入导出仍由应用负责。独立包暂名 `@markedit/react`，保持 `private: true`，未发布 npm。ESM、类型声明与 CSS 可通过本地 tarball 接入 React 19 应用。

```bash
npm run verify:lib    # 构建组件包，检查 CSS 作用域、字体资源和类型产物
npm run pack:lib      # 生成 .benchmarks/markedit-react-0.1.0.tgz
npm run example:setup # 构建打包，并安装到独立 React 示例
npm run example:dev   # 启动独立示例
npm run example:build # 验证示例类型与生产构建
```

组件支持 `value/onChange`、`defaultValue`、`readOnly`、`theme`、`mode`、`toolbar`、CodeMirror `extensions` 和 `uploadImage`；ref 提供聚焦、读取正文、插入和定位行。多实例拥有独立正文、标题锚点和对话框；主题/视图切换保留编辑实例与选区。插入对话框通过 portal 隔离宿主表单。

完整用法、状态契约和限制见 [组件 API](packages/editor/README.md)；安装与运行见 [独立消费示例](examples/react-consumer/README.md)。示例真实安装 tarball，没有源码 alias。React 为 peer dependency，独立示例确认只有一份 React；基础和公式 CSS 选择器限定在 `.markedit` 内，字体保留独立资源与 KaTeX 许可。

验收：51 项测试通过；独立示例与原工作台构建通过；浏览器验证受控编辑、父组件重置、只读、主题/视图切换、表格插入、独立实例卸载重挂、公式图表和窄屏布局，并回归工作台保存、目录与刷新恢复。SSR 框架、完整浏览器/输入法矩阵和发布流程仍待 P5；主包较大与长文最终重渲染限制仍保留。

## 开发路线

完整技术选型、原项目分析、阶段任务与验收条件见 [开发计划](docs/DEVELOPMENT_PLAN.md)。本次交付和已知限制见 [实施状态](docs/IMPLEMENTATION_STATUS.md)。

1. P0：需求与架构计划。
2. P1：可运行编辑闭环（已实现，验证范围见实施状态）。
3. P2：IndexedDB 多文档、目录、版本恢复、跨标签冲突处理（已实现）。
4. P3：公式、Mermaid、代码高亮、滚动同步、图片接口（已实现，性能限制见下文）。
5. P4：React 组件包、API 文档与独立 tarball 消费示例（已实现，未发布 npm）。
6. P5：CI、跨浏览器验收、性能记录、演示部署与发布。

## 代码入口

- `src/App.tsx`：工作台布局、命令与文件操作。
- `src/hooks/useWorkspace.ts`：自动保存队列、切换与跨标签页状态。
- `src/lib/documents.ts`：IndexedDB 事务、迁移、版本与备份。
- `src/lib/headings.ts`：AST 目录提取及预览锚点。
- `packages/editor/src/components/MarkdownEditor.tsx`：公共编辑器 API 与状态契约。
- `packages/editor/src/components/EditorInput.tsx`：CodeMirror、格式命令与图片插入。
- `packages/editor/src/components/MarkdownPreview.tsx`：独立、安全默认值的渲染组件。
- `src/components/MarkdownEditor.tsx` / `MarkdownPreview.tsx`：工作台适配层。
- `src/lib/draft.ts`：草稿 schema、解析与文件名。

## 来源

功能参考 [pandao/editor.md](https://github.com/pandao/editor.md)。当前代码独立实现，未直接复制上游源码或品牌资产；不保证兼容旧 API 或非标准语法。仓库目前是本地开发版本，尚未作为 npm 包发布，也未部署线上演示。开源前确定本项目许可并补齐第三方许可证清单。
