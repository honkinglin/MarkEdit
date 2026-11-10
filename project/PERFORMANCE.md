# Performance: first optimization pass

Measured on 2026-11-10. Baseline: `d150427`. Comparison: the current P7 workspace changes. Results below are local measurements, not guarantees for other devices or documents. [Recorded samples](performance-2026-11-10.json) include environment, fixture hash, and each measured edit.

## Results

| Metric                                          |    Before |    After | Change |
| ----------------------------------------------- | --------: | -------: | -----: |
| Initial JavaScript, minified bytes              | 1,079,507 |  896,760 | −16.9% |
| Initial JavaScript, gzip bytes                  |   354,813 |  287,093 | −19.1% |
| Welcome screen loaded JavaScript, decoded bytes | 1,109,136 |  926,389 | −16.5% |
| 100 KB input → preview, median, normal CPU      |  265.6 ms | 245.4 ms |  −7.6% |
| 100 KB input → preview, P95, normal CPU         |  276.2 ms | 266.1 ms |  −3.7% |
| 100 KB input → preview, median, 4× CPU slowdown |  363.8 ms | 301.4 ms | −17.2% |
| 100 KB input → preview, P95, 4× CPU slowdown    |  404.0 ms | 319.2 ms | −21.0% |

Source-update frame medians were 24.1 → 26.3 ms at normal CPU and 23.1 → 25.3 ms at 4× slowdown. Small frame-level differences should not be treated as statistically significant speedups.

Long tasks have **not** been eliminated. At 4× slowdown, the median longest task per edit was 84.5 → 85.5 ms and P95 was 94 → 110 ms. Parsing and React rendering remain synchronous; the reduction in total preview latency does not imply shorter individual tasks. At normal CPU, median longest-task duration stayed at zero; one measured edit after the change contained a 51 ms task. Long-task entries are counted when their start falls between beforeinput and the preview frame.

## Changes

1. **Reuse the committed preview outline.** `MarkdownPreview.onHeadings` returns the heading metadata already produced during rendering. The workspace no longer calls `getHeadings` to parse the same preview source a second time. Source-revision checks prevent stale outline navigation; unchanged content can safely reuse the same outline. Inline callbacks that update parent state do not trigger a notification loop. `getHeadings` remains available to external callers and SSR consumers.
2. **Load Markdown editing support without embedded HTML languages.** Use CodeMirror's Markdown language, high-priority Markdown keymap, and URL-paste extension directly. This removes eager HTML/CSS/JavaScript parser and completion dependencies from the initial build. Default HTML tag completion is intentionally no longer provided; raw HTML is already disabled in preview. List continuation, undo, URL paste, search, and preview code highlighting remain supported. Hosts can add language extensions.
3. **Add reproducible browser and bundle measurements.** A production-build benchmark records actual browser input, preview commits, approximate frame presentation, resource bytes, and long tasks. The bundle report walks the entry's static imports rather than considering just one output filename.
4. **Guard initial bundle size in CI.** `performance-budget.json` sets a 320,000-byte gzip budget for the entry and its static JS imports. `npm run check:bundle` fails above it and saves the module report as a CI artifact. This leaves some room above the measured 287,093 bytes while catching a return to the old baseline.

## Reproduce

```bash
npm ci
npm run benchmark                  # Creates the fixed 102,400-byte Markdown fixture
npm run benchmark:bundle -- current # Builds production assets and records module sizes
npx playwright install chromium
npm run benchmark:browser -- current 1
npm run benchmark:browser -- current-cpu4 4
npm run check:bundle
```

The browser benchmark owns a strict local preview server on `127.0.0.1:4175` and closes it afterward. Use an idle machine and avoid running builds or other benchmarks concurrently. Browser timings are deliberately not used as a CI pass/fail threshold.

For a before/after comparison, run the same benchmark scripts and fixture against both production builds. The fixture SHA-256 must match. Reports are written to `.benchmarks/browser-<label>.json` and `.benchmarks/bundle-<label>.json`.

## Method and limits

- Local headless Chromium, 1440×1000 viewport, macOS arm64, production build, no network throttling. The 4× setting is Chrome DevTools CPU emulation, not a real slow device.
- One warm 100 KB mixed Chinese/Markdown document. Two warm-up edits, followed by ten measured edits to its first visible heading. This does not represent every document shape, rapid typing, or IME composition.
- Timing starts at `beforeinput`; source and preview DOM mutations are followed by two animation frames. This approximates presentation opportunities, not measured pixel paint or INP. The preview timing includes the existing 180 ms debounce for large documents.
- P95 uses the nearest-rank method; with ten samples it is the largest measured value. Run-to-run variation is expected.
- Initial gzip bytes sum the entry and statically imported JS chunks. Welcome-screen bytes also include dynamically requested syntax highlighting. CSS, fonts, and unused dynamic diagram modules are outside the JS budget.
- The module report's `renderedLength` values help locate dependencies before final chunk minification; they should not be summed as transfer sizes.
- Mermaid/ELK still produces large on-demand chunks. This pass does not remove those capabilities or claim that their loading cost is solved.

## Next performance work

Profile long tasks across multiple fixture shapes and sustained typing. Investigate worker parsing or incremental rendering with explicit tests for reference links, duplicate headings, footnotes, selection, and scroll mappings. Avoid splitting raw Markdown at arbitrary headings: syntax and definitions can cross those boundaries.
