import { chromium } from '@playwright/test';
import { preview } from 'vite';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

// Run against a production build. No private component APIs or synthetic React updates.
const label = process.argv[2] ?? 'current';
const cpuRate = Number(process.argv[3] ?? 1);
if (!Number.isFinite(cpuRate) || cpuRate < 1 || cpuRate > 6)
  throw new Error('CPU rate must be between 1 and 6.');
if (!/^[a-z0-9-]+$/i.test(label)) throw new Error('Use an alphanumeric report label.');
const source = await readFile('.benchmarks/100kb.md', 'utf8');
const server = await preview({ preview: { host: '127.0.0.1', port: 4175, strictPort: true } });
let browser;
try {
  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const session = await page.context().newCDPSession(page);
  await session.send('Emulation.setCPUThrottlingRate', { rate: cpuRate });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('http://127.0.0.1:4175');
  const input = page.getByRole('textbox', { name: 'Markdown source', exact: true });
  await input.waitFor();
  await page.waitForFunction(() => document.querySelector('.markdown-body .hljs'));
  const startup = await page.evaluate(() => ({
    scripts: performance
      .getEntriesByType('resource')
      .filter((e) => e.initiatorType === 'script' || e.name.endsWith('.js'))
      .map((e) => ({
        file: new URL(e.name).pathname,
        bytes: e.decodedBodySize,
      })),
  }));
  await input.click();
  await input.press('ControlOrMeta+a');
  await page.keyboard.insertText(source);
  await page.waitForFunction(() =>
    document.querySelector('.markdown-body h1')?.textContent?.includes('100KB'),
  );
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    window.__longTasks = [];
    new PerformanceObserver((list) =>
      window.__longTasks.push(
        ...list.getEntries().map((e) => ({ start: e.startTime, duration: e.duration })),
      ),
    ).observe({ type: 'longtask' });
  });
  const samples = [];
  for (let index = 0; index < 12; index++) {
    await input.press('ControlOrMeta+Home');
    // Edit inside the first heading, keeping Markdown structure and a visible preview target.
    await input.press('ArrowRight');
    await input.press('ArrowRight');
    const token = `probe${index} `;
    await page.evaluate((token) => {
      window.__sample = { start: 0, source: 0, preview: 0 };
      const editor = document.querySelector('.cm-content');
      editor.addEventListener(
        'beforeinput',
        () => {
          window.__sample.start = performance.now();
        },
        { once: true },
      );
      for (const [target, key] of [
        [editor, 'source'],
        [document.querySelector('.markdown-body'), 'preview'],
      ]) {
        const observer = new MutationObserver(() => {
          if (!target.textContent.includes(token)) return;
          observer.disconnect();
          requestAnimationFrame(() =>
            requestAnimationFrame(() => {
              window.__sample[key] = performance.now();
            }),
          );
        });
        observer.observe(target, { childList: true, characterData: true, subtree: true });
      }
    }, token);
    await page.keyboard.insertText(token);
    await page.waitForFunction(() => window.__sample.source > 0 && window.__sample.preview > 0);
    samples.push(
      await page.evaluate(() => {
        const s = window.__sample;
        if (!s.start) throw new Error('Missing beforeinput event');
        const tasks = window.__longTasks.filter((t) => t.start >= s.start && t.start <= s.preview);
        return {
          sourceFrameMs: s.source - s.start,
          previewFrameMs: s.preview - s.start,
          longTaskCount: tasks.length,
          longestTaskMs: Math.max(0, ...tasks.map((t) => t.duration)),
        };
      }),
    );
    await page.waitForTimeout(250);
  }
  const measured = samples.slice(2);
  const distribution = (key) => {
    const values = measured.map((s) => s[key]).sort((a, b) => a - b);
    return {
      median: (values[4] + values[5]) / 2,
      p95: values[Math.ceil(values.length * 0.95) - 1],
    };
  };
  if (errors.length) throw new Error(errors.join('\n'));
  const report = {
    label,
    fixture: {
      bytes: Buffer.byteLength(source),
      sha256: createHash('sha256').update(source).digest('hex'),
    },
    environment: {
      node: process.version,
      platform: `${process.platform}/${process.arch}`,
      browser: browser.version(),
      viewport: '1440x1000',
      cpuThrottlingRate: cpuRate,
    },
    startup: { ...startup, jsBytes: startup.scripts.reduce((sum, s) => sum + s.bytes, 0) },
    warmupEdits: 2,
    measuredEdits: measured.length,
    sourceFrameMs: distribution('sourceFrameMs'),
    previewFrameMs: distribution('previewFrameMs'),
    longestTaskMs: distribution('longestTaskMs'),
    samples: measured,
    limitation:
      'Local Chromium, warm document, configurable CPU throttling, no network throttling. Mutation plus two animation frames approximates presentation; it is not an INP or pixel-paint measurement. Preview includes deliberate debounce. Startup bytes are decoded JS, not compressed network transfer.',
  };
  await mkdir('.benchmarks', { recursive: true });
  await writeFile(`.benchmarks/browser-${label}.json`, JSON.stringify(report, null, 2) + '\n');
  console.log(
    JSON.stringify(
      {
        label,
        startupJsBytes: report.startup.jsBytes,
        sourceFrameMs: report.sourceFrameMs,
        previewFrameMs: report.previewFrameMs,
        longestTaskMs: report.longestTaskMs,
      },
      null,
      2,
    ),
  );
} finally {
  await browser?.close();
  await new Promise((resolve, reject) =>
    server.httpServer.close((error) => (error ? reject(error) : resolve())),
  );
}
