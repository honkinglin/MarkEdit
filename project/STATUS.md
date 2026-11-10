# Project status and next milestones

Reviewed on 2026-11-10 against the current implementation and development roadmap.

## Implemented

- Markdown workspace: editing, preview, formatting, themes, focus mode, command menu, outline, adjustable panes, and scroll sync.
- Local document lifecycle: IndexedDB, autosave, migration, multiple documents, search, trash, snapshots, cross-tab conflict handling, and backup import/export.
- Markdown extensions: GFM, math, diagrams, syntax highlighting, insertion dialogs, and host-provided image upload callbacks.
- React package: controlled/uncontrolled contracts, read-only state, configurable toolbar, extensions, ref commands, scoped styles, and independent tarball consumer.
- Open-source foundations: MIT license, CI, API documentation, architecture records, reproducible checks, screenshots, and a Vercel Git integration.
- English interface: localized UI catalogs, accessible names, notifications, error messages, new-document templates, English formatting, and English READMEs. Existing content is preserved.

The English implementation is currently a local change. It must be committed and pushed before GitHub CI and the Vercel Git integration can validate and deploy it. A successful earlier remote build does not validate these new changes.

## Remaining work, in recommended order

| Priority | Work                                         | Completion criteria                                                                                                                                                                                                                          |
| -------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1        | Long-document performance and bundle size    | Measure browser input-to-preview latency and long tasks on a reproducible 100 KB fixture; reduce initial loading and unnecessary rendering; record before/after results. Current SSR timings do not prove interactive performance.           |
| 2        | Package and release publication              | Confirm an available npm name and publishing account, choose a version, review dependency notices, publish a tested tarball, and create a GitHub release. The package is intentionally still private.                                        |
| 3        | Broader browser and accessibility validation | Test actual Safari/iOS/Android, IME composition, system clipboard permissions, keyboard and screen-reader flows, quota exhaustion, and crash recovery. Playwright WebKit and emulated mobile viewports are not substitutes for all of these. |
| 4        | Open-source presentation                     | Record a short demo video/GIF and translate the remaining contribution, architecture, roadmap, and release records. The root, package, and example READMEs are already English.                                                              |
| 5        | Optional integrations                        | Provide a documented real image-upload adapter and validate a client-boundary example in an SSR framework. These should not require a backend for the standalone workspace.                                                                  |

## Deliberate scope boundaries

- English is the only requested UI locale. Additional catalogs and language switching are future work, not a missing control in this release.
- The editor exposes an image upload callback; the workspace accepts image URLs. A hosted upload service is not included.
- Accounts, cloud sync, collaboration, AI, rich-text WYSIWYG, and native mobile apps are outside the first release.
- An offline service worker is not implemented. Local document storage does not guarantee that the application can cold-start offline.
- Emoji shortcuts and nonstandard Markdown dialects are not part of the current core contract.

Recommended next development phase: browser performance measurement followed by targeted rendering and loading improvements, then package publication.
