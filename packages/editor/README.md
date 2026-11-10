# mark-edit

A React 19 and TypeScript Markdown editor with a standalone preview. Built on CodeMirror 6, with GFM, KaTeX, Mermaid, and on-demand syntax highlighting. Independent of the workspace, IndexedDB, and localStorage.

The package uses the MIT license and ships ESM, TypeScript declarations, and CSS. A bundler with CSS and dynamic import support is required. Interactive components target browsers; SSR framework integrations have not been validated.

## Install

```bash
npm install mark-edit react@^19 react-dom@^19
```

Import `mark-edit/style.css` once in your application. For release status and version history, see [npm](https://www.npmjs.com/package/mark-edit) and [GitHub Releases](https://github.com/honkinglin/MarkEdit/releases).

## Build from source

From the repository root:

```bash
npm ci
npm run pack:lib
```

Install `.benchmarks/mark-edit-0.1.0.tgz` in another React 19 application, then import the styles explicitly:

```tsx
import { useState } from 'react';
import { MarkdownEditor } from 'mark-edit';
import 'mark-edit/style.css';

export function WritingArea() {
  const [value, setValue] = useState('# Hello');
  return <MarkdownEditor value={value} onChange={setValue} height={480} />;
}
```

Run `npm run example:setup` and `npm run example:dev` from the root for an independent consumer application. `npm run example:build` checks its types and production build. The example installs the tarball with its own dependency tree, without source aliases.

## MarkdownEditor

| Prop                 | Type / default                               | Description                                                                                                                     |
| -------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `value`              | `string`                                     | Controlled content; requires `onChange` and excludes `defaultValue`.                                                            |
| `defaultValue`       | `string` / `''`                              | Initial uncontrolled content, read only on mount.                                                                               |
| `onChange`           | `(value: string) => void`                    | Changes from editing, toolbar actions, or ref insertion. External prop updates do not trigger it.                               |
| `readOnly`           | `boolean` / `false`                          | Blocks editing, toolbar changes, ref insertion, and pending upload insertion. Selection, copying, and preview remain available. |
| `theme`              | `'light' \| 'dark'` / `'light'`              | Per-instance theme; switching preserves the editor and selection.                                                               |
| `mode`               | `'edit' \| 'split' \| 'preview'` / `'split'` | Hidden panes preserve editor state and undo history.                                                                            |
| `toolbar`            | `boolean \| readonly ToolbarItem[]` / `true` | Hide the toolbar or choose built-in items in their standard order.                                                              |
| `extensions`         | CodeMirror `Extension[]`                     | Trusted host extensions. Keep the array reference stable.                                                                       |
| `uploadImage`        | `(file: File) => Promise<string>`            | Upload pasted or dropped images and return an HTTP(S) URL.                                                                      |
| `syncScroll`         | `boolean` / `true`                           | Synchronize split panes by source line position.                                                                                |
| `height`             | CSS height / `480`                           | Numbers represent pixels; CSS strings are also accepted.                                                                        |
| `className`, `style` | React attributes                             | Applied to the component root. `style.height` can override `height`.                                                            |
| `ariaLabel`          | `string` / `'Markdown source'`               | Accessible source input name; use distinct labels for multiple instances.                                                       |
| `ref`                | `Ref<MarkdownEditorHandle>`                  | Imperative commands described below.                                                                                            |

`ToolbarItem`: `bold`, `italic`, `heading`, `quote`, `list`, `link`, `image`, `code`, `table`.

### State contract

Controlled mode uses `value` as the source of truth. Update React state synchronously in `onChange`; persistence may be asynchronous. If the parent rejects a change, the editor restores `value`. External resets do not trigger `onChange`. Do not switch between controlled and uncontrolled modes within one mount.

In uncontrolled mode, later `defaultValue` changes do not reset content. Use a different React `key` when switching documents to reset content, selection, history, and pending uploads together. Theme, toolbar, and view changes do not recreate the editor. The component does not autosave; unmounting an uncontrolled instance discards its content.

For content over 30,000 characters, preview updates are coalesced over 180 ms. Source editing and `onChange` do not wait for the preview, though a complete preview render can still occupy the main thread.

### Ref commands

```tsx
import { useRef } from 'react';
import { MarkdownEditor, type MarkdownEditorHandle } from 'mark-edit';

function Example() {
  const editor = useRef<MarkdownEditorHandle>(null);
  return (
    <>
      <button onClick={() => editor.current?.insertText('**hello**')}>Insert</button>
      <MarkdownEditor ref={editor} defaultValue="# First draft" />
    </>
  );
}
```

- `focus()`: focus the source input. Switch out of preview-only mode to make it visible.
- `getValue()`: read content from the latest React commit. Inside `onChange`, use its argument for the newest value.
- `insertText(text)`: replace the selection in an undoable transaction. Controlled parents must accept the change. No effect in read-only mode.
- `jumpToLine(line)`: jump to a one-based line and focus the source. Values are truncated and clamped; non-finite values are ignored.

### Images and extensions

The host owns upload authentication, networking, and storage. The package validates PNG/JPEG/GIF/WebP, a 5 MB size limit, and the returned URL. Without a callback, the editor suggests inserting an image URL. Upload errors appear locally. Unmounting or enabling read-only mode before completion prevents insertion; the host request is not automatically cancelled.

The default editor uses Markdown syntax support with list continuation and URL-paste handling. HTML tag completion and embedded HTML/CSS/JavaScript parsing are not loaded by default; hosts can supply additional language support through `extensions`. Preview syntax highlighting is unchanged.

CodeMirror extensions are trusted application code. Do not accept scripts from document authors. Ensure host extensions use one compatible instance of `@codemirror/state`.

## MarkdownPreview

```tsx
import { MarkdownPreview, getHeadings } from 'mark-edit';
const prefix = 'article-a-';
const headings = getHeadings('# Heading', prefix);
// headings[0].id matches the rendered heading ID.
<MarkdownPreview value="# Heading" headingPrefix={prefix} theme="light" />;
```

Required prop: `value: string`. Optional props: `theme`, `className`, `style`, `headingPrefix`, and `onHeadings`. By default, each preview generates its own prefix with React `useId`; hosts must keep custom prefixes unique. `getHeadings(value, prefix = '')` returns `{ id, text, depth, line }[]` without reading the DOM.

### Reuse the rendered outline

Pass `onHeadings={(headings) => ...}` to receive `{ id, text, depth, line }[]` after the preview commits. This reuses heading metadata from the rendered document and avoids a second Markdown parse. It fires when preview content or its heading prefix changes, not when the callback identity alone changes. Inline callbacks may safely store the result in parent state. It is a client-side callback; `getHeadings` remains available for standalone and server-side extraction.

The workspace uses this callback and hides stale outlines while another document or preview revision is loading.

## Language

English is the default and currently the only supported interface language, including accessible names, dialogs, notifications, and inserted placeholders. Browser language does not change it. Document content is never translated. UI copy is centralized in `src/i18n`; a per-instance locale API can be added when another locale is supported. CodeMirror's built-in controls already use English by default.

## Styling and packaging

- Base and formula CSS selectors are scoped to `.markedit`; there are no page-level resets. KaTeX fonts retain standard font names and ship as separate assets.
- Customize `--bg`, `--text`, `--muted`, `--line`, and `--accent` under `.markedit`. Host global styles may still affect components; there is no Shadow DOM isolation.
- React and React DOM are peer dependencies. Other dependencies remain ESM imports, so final bundle size depends on the host bundler.
- KaTeX, Mermaid, and highlighting use dynamic imports. Formula CSS and fonts load with the math module. First use requires downloading assets; offline availability is not guaranteed.
- Production consumers may see large-chunk warnings. A small library entry does not represent the size of all dependencies.

## Safety and compatibility

Raw HTML is ignored. Math uses `trust: false` and expansion limits. Diagrams use strict mode, disable inline configuration, and sanitize SVG. Rendering failures affect individual blocks. External images are requested by the browser; hosts should define their own network privacy policy.

Nonstandard `flow`, `seq`, and `[TOC]` directives are not supported. Use Mermaid diagrams and `getHeadings` for an outline.

### Transitive math dependency

The editor renders formulas with KaTeX `^0.19.1`. Upstream `remark-math` also installs an older KaTeX through `micromark-extension-math` for an HTML renderer that this editor does not call. That transitive version is flagged by [GHSA-238p-pmpm-9mq7](https://github.com/advisories/GHSA-238p-pmpm-9mq7). Until upstream updates its range, npm consumers can add this override to their application package.json:

```json
{
  "overrides": {
    "micromark-extension-math": {
      "katex": "^0.19.1"
    }
  }
}
```

The workspace and independent example use this override. Overrides in a library package are not inherited by consumers; the application must declare it. Test your application after changing dependency resolutions.
