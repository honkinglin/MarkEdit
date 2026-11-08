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
npm test       # 数据恢复、文件名和预览安全回归测试
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
- 单草稿自动保存与刷新恢复；Markdown 文件导入导出。
- 存储错误提示与损坏草稿保护；原始 HTML 默认不渲染。

当前仅保存到此浏览器，不是云备份。浏览器清理站点数据会删除草稿，请用导出备份。导入会替换草稿，并提示先备份。首次启动需加载应用资源；此版本不包含离线 Service Worker。

## 开发路线

完整技术选型、原项目分析、阶段任务与验收条件见 [开发计划](docs/DEVELOPMENT_PLAN.md)。本次交付和已知限制见 [实施状态](docs/IMPLEMENTATION_STATUS.md)。

1. P0：需求与架构计划。
2. P1：可运行编辑闭环（已实现，验证范围见实施状态）。
3. P2：IndexedDB 多文档、目录、版本恢复、跨标签冲突处理。
4. P3：公式、Mermaid、代码高亮、滚动同步、图片接口。
5. P4：抽取 React 组件包、API 文档与独立消费示例。
6. P5：CI、跨浏览器验收、性能记录、演示部署与发布。

## 代码入口

- `src/App.tsx`：工作台与草稿生命周期。
- `src/components/MarkdownEditor.tsx`：编辑引擎与格式命令。
- `src/components/MarkdownPreview.tsx`：独立、安全默认值的渲染组件。
- `src/lib/draft.ts`：草稿 schema、解析与文件名。

## 来源

功能参考 [pandao/editor.md](https://github.com/pandao/editor.md)。当前代码独立实现，未直接复制上游源码或品牌资产；不保证兼容旧 API 或非标准语法。仓库目前是本地开发版本，尚未作为 npm 包发布，也未部署线上演示。开源前确定本项目许可并补齐第三方许可证清单。
