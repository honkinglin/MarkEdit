# Project status and next milestones

Reviewed on 2026-11-10 against the current implementation and development roadmap.

## Implemented

- Markdown workspace: editing, preview, formatting, themes, focus mode, command menu, outline, adjustable panes, and scroll sync.
- Local document lifecycle: IndexedDB, autosave, migration, multiple documents, search, trash, snapshots, cross-tab conflict handling, and backup import/export.
- Markdown extensions: GFM, math, diagrams, syntax highlighting, insertion dialogs, and host-provided image upload callbacks.
- React package: controlled/uncontrolled contracts, read-only state, configurable toolbar, extensions, ref commands, scoped styles, and independent tarball consumer.
- Open-source foundations: MIT license, CI, API documentation, architecture records, reproducible checks, screenshots, and a Vercel Git integration.
- English interface: localized UI catalogs, accessible names, notifications, error messages, new-document templates, English formatting, and English READMEs. Existing content is preserved.

The English implementation is committed as `d150427`. The first performance pass is implemented locally: it reuses preview headings, removes eager embedded HTML language support, adds browser measurements, and introduces a CI bundle budget. See [PERFORMANCE.md](PERFORMANCE.md). These performance changes have not yet been committed or deployed.

## Remaining work, in recommended order

| Priority | Work                                         | Completion criteria                                                                                                                                                                                                                                                                                                                                         |
| -------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1        | Remaining long-task and loading work         | The first measured pass reduced initial gzip JS by 19.1% and throttled preview latency by 17.2%. Synchronous long tasks and large on-demand diagram chunks remain; investigate worker parsing or incremental rendering with broader fixtures.                                                                                                               |
| 2        | Package and release publication              | Confirm an available npm name and publishing account, choose a version, review dependency notices, publish a tested tarball, and create a GitHub release. The selected package is `react-markedit@0.1.0` under npm account `kyrielin`; publishing uses an inspected tarball with integrity checks. See the release guide for registry and automation setup. |
| 3        | Broader browser and accessibility validation | Test actual Safari/iOS/Android, IME composition, system clipboard permissions, keyboard and screen-reader flows, quota exhaustion, and crash recovery. Playwright WebKit and emulated mobile viewports are not substitutes for all of these.                                                                                                                |
| 4        | Open-source presentation                     | Record a short demo video/GIF and translate the remaining contribution, architecture, roadmap, and release records. The root, package, and example READMEs are already English.                                                                                                                                                                             |
| 5        | Optional integrations                        | Provide a documented real image-upload adapter and validate a client-boundary example in an SSR framework. These should not require a backend for the standalone workspace.                                                                                                                                                                                 |

## Deliberate scope boundaries

- English is the only requested UI locale. Additional catalogs and language switching are future work, not a missing control in this release.
- The editor exposes an image upload callback; the workspace accepts image URLs. A hosted upload service is not included.
- Accounts, cloud sync, collaboration, AI, rich-text WYSIWYG, and native mobile apps are outside the first release.
- An offline service worker is not implemented. Local document storage does not guarantee that the application can cold-start offline.
- Emoji shortcuts and nonstandard Markdown dialects are not part of the current core contract.

Next milestone: prepare package publication and a formal release, while tracking long-task improvements as a separate measured workstream. The package name and npm account are confirmed. Account-side trusted-publisher configuration is still separate from local npm login.

## P8 release tooling

Version-derived tarballs, immutable candidate manifests, clean-source publication checks, package file/license validation, a tag-driven GitHub Actions workflow, and versioned release notes are implemented. The root workspace remains private. Actual registry versions and GitHub Releases are the source of truth for publication status.
