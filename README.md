# MarkEdit

一个面向专注写作的 Markdown 工作台，也是一套可复用的 React 编辑器与预览组件。

![MarkEdit 工作台](assets/workbench.png)

> **项目状态：** 本地开发中，尚未部署在线演示或发布 npm；项目许可证尚未确定。

[组件文档](packages/editor/README.md) · [架构说明](project/ARCHITECTURE.md) · [路线图](project/ROADMAP.md) · [贡献指南](CONTRIBUTING.md)

## 特性

- **顺畅写作：** CodeMirror 6 编辑器、格式工具栏、搜索替换、撤销/重做，以及编辑、分屏和预览模式。
- **丰富预览：** 支持 GFM、数学公式、Mermaid 图表和常用语言的代码高亮。
- **本地文档库：** 基于 IndexedDB 管理多篇文档，支持自动保存、搜索、回收站、版本快照和跨标签页同步。
- **高效导航：** 自动生成标题目录，支持预览与源码之间的标题跳转和同步滚动。
- **便捷工作流：** 支持 Markdown 导入、完整工作区备份与恢复、深浅主题、专注模式和键盘快捷键。
- **可复用组件：** 独立的 React 编辑器与预览组件，可在 React 19 项目中使用。

## 快速开始

需要 Node.js 24 LTS 和 npm。克隆仓库后，在项目根目录运行：

```bash
npm ci
npm run dev
```

使用终端显示的本地地址打开工作台。首次安装需要网络连接。

运行测试和生产构建：

```bash
npm test
npm run build
```

## 使用工作台

- `⌘/Ctrl + K`：打开命令菜单，查找操作、备份文档或查看快捷键。
- `⌘/Ctrl + S`：立即保存当前文档。
- `Esc`：退出专注模式或关闭命令菜单。
- 在文档目录和历史面板中管理标题导航、版本快照与恢复。

文档仅保存在当前浏览器，不会自动同步到云端。清除浏览器站点数据会删除本地文档，请定期导出工作区备份。导入 Markdown 会创建新文档；导入工作区 JSON 会创建独立副本，不会覆盖现有内容。

Markdown 文件导入上限为 1 MB；工作区 JSON 备份上限为 20 MB、1000 篇文档。备份包含回收站和历史版本，请妥善保管。

## Markdown 支持

除标准 Markdown 与 GFM 外，预览还支持：

- **数学公式：** 行内 `$E=mc^2$`，块级公式使用 `$$` 定界。
- **Mermaid：** 在围栏代码块中指定 `mermaid`，可绘制流程图等图表。
- **代码高亮：** 按需加载 JavaScript、TypeScript、Python、JSON、CSS、HTML/XML、Bash、SQL 和 Markdown。

可导入[扩展语法示例](examples/extended-markdown.md)进行体验。原始 HTML 默认不渲染；公式和图表采用受限配置，图表 SVG 会经过清理。复杂图表可能受安全策略限制。

## React 组件

编辑器组件位于 `packages/editor`，与工作台的文档存储和备份功能解耦。组件包当前为本地验证版本，未发布 npm；可生成本地 tarball 并在独立示例中验证：

```bash
npm run pack:lib
npm run example:setup
npm run example:dev
```

完整属性说明、受控与非受控状态契约、样式边界和兼容性限制见[组件文档](packages/editor/README.md)。可运行的独立消费示例见 [examples/react-consumer](examples/react-consumer/README.md)。

组件支持受控或非受控内容、只读模式、主题与视图切换、工具栏配置、CodeMirror 扩展和可选图片上传回调。图片上传由接入应用负责，工作台本身不提供上传服务。

## 开发与验证

```bash
npm run check
```

该命令检查格式、类型、单元测试、工作台构建和组件包。运行端到端测试前，先安装 Playwright 浏览器：

```bash
npx playwright install chromium firefox webkit
npm run test:e2e
```

GitHub Actions 配置位于 `.github/workflows/ci.yml`，用于校验并保存测试证据，不会自动部署或发布。性能基准可通过 `npm run benchmark` 生成；本地基准结果与已知限制见[路线图](project/ROADMAP.md)。

## 项目文档

- [贡献指南](CONTRIBUTING.md)
- [架构说明](project/ARCHITECTURE.md)
- [开发路线图](project/ROADMAP.md)
- [发布检查表](project/RELEASE.md)
- [版本记录](CHANGELOG.md)
- [第三方声明](THIRD_PARTY_NOTICES.md)

## 已知限制

- 尚未提供在线演示、npm 发布或离线 Service Worker。
- 文档数据保存在本地浏览器，不是云端备份。
- 大型文档的预览更新和 Mermaid 相关依赖体积仍有优化空间。
- 图片上传服务、SSR 框架兼容及完整浏览器和输入法矩阵尚未完成验收。
- 项目许可证尚未确定；正式开源前需补齐许可与发布流程。
