<div align="center">

# MarkEdit

**A focused space for writing. A complete workflow for Markdown.**

Local-first Markdown workspace · Composable React editor

[![CI](https://github.com/honkinglin/MarkEdit/actions/workflows/ci.yml/badge.svg)](https://github.com/honkinglin/MarkEdit/actions/workflows/ci.yml)
[![MIT License](https://img.shields.io/badge/license-MIT-166534.svg)](LICENSE)
[![React 19](https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white)](packages/editor/README.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)](tsconfig.json)

[Live demo](https://markedit-seven.vercel.app) · [Quick start](#quick-start) · [React components](#react-components) · [Architecture](project/ARCHITECTURE.md) · [Contributing](CONTRIBUTING.md)

</div>

![MarkEdit workspace with document navigation, source editing, and live preview](assets/workbench.png)

MarkEdit brings writing, previewing, document management, and version recovery into one workspace. No account or backend setup is required. Write technical notes, maintain a README, or organize documents with formulas and diagrams.

The same editing capabilities are available as standalone React editor and preview components, ready to embed in your own application.

## Built for thoughtful writing

| Capability               | What you get                                                                                                  |
| ------------------------ | ------------------------------------------------------------------------------------------------------------- |
| **Focused editing**      | CodeMirror 6, formatting tools, search and replace, undo and redo, and edit, split, preview, and focus modes. |
| **Rich expression**      | GFM tables and task lists, KaTeX formulas, Mermaid diagrams, and on-demand syntax highlighting.               |
| **Organized documents**  | Multiple documents, search, autosave, trash, version snapshots, and cross-tab synchronization.                |
| **Long-form navigation** | A heading outline, unique anchors, source and preview navigation, and synchronized scrolling.                 |
| **Portable content**     | Markdown import and export, workspace backups, and restoration as independent copies.                         |
| **Everyday comfort**     | A command menu, keyboard shortcuts, light and dark themes, adjustable panes, and responsive layouts.          |

### Your documents stay in your browser

MarkEdit stores documents in IndexedDB. Version snapshots, recoverable trash, and exportable backups help you recover and move your work.

There is no automatic cloud sync. Clearing site data deletes local documents, so export backups regularly. External images in your documents still send requests to their image hosts.

### Words, code, formulas, and diagrams

Use `$E=mc^2$` for inline math, `$$` for display math, and a `mermaid` fenced code block for diagrams. Syntax highlighting supports JavaScript, TypeScript, Python, JSON, CSS, HTML/XML, Bash, SQL, and Markdown.

Try the [extended Markdown sample](examples/extended-markdown.md). Raw HTML is disabled by default. Diagrams use restricted configuration and sanitized SVG; a rendering failure stays local to the affected diagram.

## Quick start

Requires **Node.js 24** and npm.

```bash
git clone https://github.com/honkinglin/MarkEdit.git
cd MarkEdit
npm ci
npm run dev
```

Open the local URL printed in your terminal. Use `npm run build` for a production build; static assets are written to `dist/`.

| Shortcut       | Action                                     |
| -------------- | ------------------------------------------ |
| `⌘ / Ctrl + K` | Open the command menu                      |
| `⌘ / Ctrl + S` | Save the current document                  |
| `Esc`          | Close the command menu or leave focus mode |

Markdown imports are limited to 1 MB. Workspace backups are limited to 20 MB and 1,000 documents, including trash and version history.

## React components

Embed the editor in your product or render Markdown with the standalone preview. Components do not depend on the workspace document store and do not take ownership of application persistence.

```tsx
import { useState } from 'react';
import { MarkdownEditor } from 'mark-edit';
import 'mark-edit/style.css';

export function WritingArea() {
  const [value, setValue] = useState('# Hello, MarkEdit');

  return <MarkdownEditor value={value} onChange={setValue} height={480} />;
}
```

**Controlled and uncontrolled state · Standalone preview · Read-only mode · Per-instance themes · Configurable toolbar · CodeMirror extensions · Image upload callback · Ref commands**

![React components: controlled editor, independent instance, and standalone preview](assets/react-components.png)

Install the React package:

```bash
npm install mark-edit react@^19 react-dom@^19
```

For local development, run the independent example, which installs the actual package tarball:

```bash
npm run example:setup
npm run example:dev
```

To use it in another React 19 application, install the generated `.benchmarks/mark-edit-0.1.0.tgz`.

Read the [API and integration guide](packages/editor/README.md) for state contracts, extension points, styles, and browser requirements. The host application supplies image uploads through `uploadImage`.

## Language support

**English is the default and currently the only supported interface language**, regardless of browser language. This includes dialogs, accessibility labels, notices, new document templates, and the component example. Existing documents and imported content are preserved in their original language.

UI copy lives in typed English catalogs under `src/i18n`, `packages/editor/src/i18n`, and `examples/react-consumer/src/i18n`. Parameterized messages handle counts and dynamic text; dates and numbers use English formatting. See the [localization guide](project/LOCALIZATION.md) before adding another locale. Internal development records may still be in Chinese.

## Engineering foundations

- **Clear boundaries:** the workspace owns document lifecycle, the editor owns editing transactions, and the preview owns rendering. Reusable components are packaged independently.
- **Explicit contracts:** strict TypeScript, React peer dependencies, ESM output, type declarations, and scoped styles.
- **On-demand extensions:** formulas, diagrams, and highlighting load separately. Large-document preview updates are coalesced while source editing responds independently.
- **Reproducible checks:** unit tests exercise storage, editing, safety, and component state; Playwright tests cover the workspace and an application consuming the actual tarball.

The browser suite covers Chromium, Firefox, WebKit, and a mobile viewport. See the [validation record](project/VALIDATION.md) for environments and coverage limits, and the CI badge above for the latest remote result.

```bash
# Formatting, types, unit tests, application build, and package verification
npm run check

# Cross-browser user flows
npm run example:setup
npm run example:build
npx playwright install chromium firefox webkit
npm run test:e2e

# Performance measurements and artifact / dependency license reports
npm run benchmark
npm run release:report

# Production browser timing and initial bundle analysis
npm run benchmark:bundle -- current
npm run benchmark:browser -- current 4
```

See the [performance report](project/PERFORMANCE.md) for the 100 KB fixture, before/after measurements, and remaining main-thread limits.

## Roadmap and contributions

Ongoing work focuses on long-document responsiveness, bundle size, real input-method and mobile-device coverage, and package publication. Cloud sync, a built-in image upload service, and an offline service worker are not included. SSR framework integrations require separate validation.

Share reproducible bugs and use cases in [Issues](https://github.com/honkinglin/MarkEdit/issues), or follow the [contribution guide](CONTRIBUTING.md).

[Project status](project/STATUS.md) · [Architecture](project/ARCHITECTURE.md) · [Roadmap](project/ROADMAP.md) · [Release checklist](project/RELEASE.md) · [Changelog](CHANGELOG.md)

## License

[MIT](LICENSE) © honkinglin and contributors. See [third-party notices](THIRD_PARTY_NOTICES.md) for dependency and font licenses.
