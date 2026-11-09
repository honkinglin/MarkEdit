# @markedit/react

React 19 + TypeScript Markdown 编辑器与独立预览组件。基于 CodeMirror 6，支持 GFM、KaTeX、Mermaid 和按需代码高亮。实现不依赖工作台、IndexedDB 或 localStorage。

当前为本地打包验证版本，`private: true`，尚未发布 npm。包名与开源许可将在发布阶段确认。只输出 ESM 与 TypeScript 声明；需要支持 CSS 和动态 import 的打包器。交互组件面向浏览器；Next.js 等环境需在客户端边界使用，未完成 SSR 框架兼容验收。

## 安装本地构建

在仓库根目录运行：

```bash
npm ci
npm run pack:lib
```

在另一个 React 19 项目中安装 `.benchmarks/markedit-react-0.1.0.tgz`，然后显式导入样式：

```tsx
import { useState } from 'react';
import { MarkdownEditor } from '@markedit/react';
import '@markedit/react/style.css';

export function WritingArea() {
  const [value, setValue] = useState('# Hello');
  return <MarkdownEditor value={value} onChange={setValue} height={480} />;
}
```

仓库自带真实消费 tarball 的独立示例：根目录运行 `npm run example:setup`，然后 `npm run example:dev`。`npm run example:build` 检查示例类型和生产构建。示例有独立 package-lock，不属于 workspace，不通过 alias 引用源码。

## MarkdownEditor

| 属性                 | 类型 / 默认值                                | 说明                                                                 |
| -------------------- | -------------------------------------------- | -------------------------------------------------------------------- |
| `value`              | `string`                                     | 受控正文，与 `defaultValue` 互斥；必须传入 `onChange`                |
| `defaultValue`       | `string` / `''`                              | 非受控初值，仅首次挂载读取                                           |
| `onChange`           | `(value: string) => void`                    | 用户编辑、工具栏和 ref 插入产生的内容变化；外部 prop 更新不触发      |
| `readOnly`           | `boolean` / `false`                          | 禁止用户编辑、工具栏、ref 插入及迟到的上传插入；仍可选取、复制和预览 |
| `theme`              | `'light' \| 'dark'` / `'light'`              | 每个实例独立主题，动态切换保留选区与编辑实例                         |
| `mode`               | `'edit' \| 'split' \| 'preview'` / `'split'` | 隐藏面板保留编辑器与撤销历史                                         |
| `toolbar`            | `boolean \| readonly ToolbarItem[]` / `true` | `false` 隐藏；数组选择内置按钮，按内置顺序显示                       |
| `extensions`         | CodeMirror `Extension[]`                     | 可信宿主提供的编辑器扩展；建议保持数组引用稳定                       |
| `uploadImage`        | `(file: File) => Promise<string>`            | 粘贴/拖拽图片上传，返回 HTTP(S) URL                                  |
| `syncScroll`         | `boolean` / `true`                           | 分屏时启用基于源码行的双向滚动                                       |
| `height`             | CSS height / `480`                           | 数字为 px，也可用 CSS 字符串                                         |
| `className`, `style` | 标准 React 属性                              | 应用在组件根节点，`style.height` 可覆盖 `height`                     |
| `ariaLabel`          | `string` / `'Markdown 源码'`                 | 源码输入框名称，建议多实例使用不同名称                               |
| `ref`                | `Ref<MarkdownEditorHandle>`                  | 下列实例命令                                                         |

`ToolbarItem`：`bold`、`italic`、`heading`、`quote`、`list`、`link`、`image`、`code`、`table`。

### 状态契约

受控模式以 `value` 为唯一事实来源。`onChange` 内应同步更新 React state；可以异步保存，但不要延迟回传 `value`。如果父组件拒绝变化，编辑器会恢复原 `value`。外部重置正文不会回调 `onChange`。不要在同一次挂载中切换受控/非受控模式。

非受控模式由组件维护正文，后续改变 `defaultValue` 不会重置。切换到另一份文档时使用不同的 `key`，以同时重置正文、选区、撤销历史和待完成上传。主题、工具栏和视图变化不会重建编辑器。此组件不自动保存，卸载非受控实例后其内容会丢失。

超过 30,000 字符的预览合并 180ms 内的更新，源码与 `onChange` 不等待预览；大文档完整重渲染仍可能占用主线程。

### Ref 命令

```tsx
import { useRef } from 'react';
import { MarkdownEditor, type MarkdownEditorHandle } from '@markedit/react';

function Example() {
  const editor = useRef<MarkdownEditorHandle>(null);
  return (
    <>
      <button onClick={() => editor.current?.insertText('**hello**')}>插入</button>
      <MarkdownEditor ref={editor} defaultValue="# 初稿" />
    </>
  );
}
```

- `focus()`：聚焦源码输入框；纯预览模式需要先切回编辑或分屏才能显示焦点。
- `getValue()`：读取最近一次 React 提交的正文；在 `onChange` 内需要最新内容时直接使用回调参数。
- `insertText(text)`：替换当前选区，可撤销；受控模式需由父组件接受更新；只读时无操作。
- `jumpToLine(line)`：一开始计数，截取整数并限制到有效行，非有限数字忽略；定位并聚焦源码。

### 图片与扩展

上传回调由宿主负责鉴权、网络请求与存储。本包仅校验 PNG/JPEG/GIF/WebP、最大 5 MB，以及返回 URL；没有上传回调时提示使用图片 URL。上传失败显示局部提示，卸载或完成前切换只读不会插入；不主动取消宿主网络请求。

`extensions` 是 CodeMirror 6 扩展，不是旧 Editor.md 的插件路径。扩展属于可信应用代码，能改变编辑行为；不要接收文档作者提供的任意脚本。使用宿主自定义扩展时保证 `@codemirror/state` 只有一个兼容实例。

## MarkdownPreview

```tsx
import { MarkdownPreview, getHeadings } from '@markedit/react';
const prefix = 'article-a-';
const headings = getHeadings('# 标题', prefix);
// headings[0].id 对应预览中标题 ID
<MarkdownPreview value="# 标题" headingPrefix={prefix} theme="light" />;
```

属性：必填 `value: string`；可选 `theme`、`className`、`style`、`headingPrefix`。默认每个预览通过 React `useId` 生成独立标题前缀；自定义前缀需由宿主保证唯一。`getHeadings(value, prefix = '')` 返回 `{ id, text, depth, line }[]`，不会读取 DOM。工作台兼容层保留原有空前缀目录行为。

## 样式与打包边界

- 基础 CSS 与公式 CSS 的选择器均限定在 `.markedit` 内；没有页面级 `body`、`:root` 或通用按钮重置。KaTeX 字体保留标准字体名，以独立资源提供。
- 可通过 `.markedit` 下的 CSS 变量调整 `--bg`、`--text`、`--muted`、`--line`、`--accent` 等；宿主全局样式仍可能影响组件，不提供 Shadow DOM 隔离。
- React 和 React DOM 为 peerDependencies；包本身不内联 React。其余依赖保留为 ESM imports，最终大小取决于宿主打包器。
- KaTeX、Mermaid、语言高亮通过动态 import 加载；字体和公式 CSS 跟随公式模块。首次使用仍需下载相应资源，不保证离线可用。
- 生产消费者仍有大 chunk 警告；库入口较小不代表包含第三方依赖后的应用体积较小。

## 安全与兼容

默认忽略原始 HTML。公式采用 `trust: false` 并限制展开；图表使用 strict、禁用文档内配置，SVG 经过清理。错误公式/图表只影响对应区块。外部图片会由浏览器请求，宿主需自行提供网络隐私策略。

参考原项目的 [实例与配置示例](https://github.com/pandao/editor.md/blob/master/examples/use-requirejs.html) 和 [只读示例](https://github.com/pandao/editor.md/blob/master/examples/readonly.html)，将 `getMarkdown`、内容设置、工具栏与预览控制转为 React props/ref。未复制其实现，不兼容 jQuery/AMD API、旧 `flow` / `seq`、`[TOC]` 等非标准指令；图表使用 Mermaid，目录使用 `getHeadings`。
