import React from 'react';
import fs from 'node:fs';
import { performance } from 'node:perf_hooks';
import { renderToStaticMarkup } from 'react-dom/server';
import { MarkdownPreview } from '../src/components/MarkdownPreview';
import { getHeadings } from '../src/lib/headings';

const block = (i: number) =>
  `## 第 ${i} 节：写作与结构\n\n${'这是用于测量的中文技术文档。包含清晰的段落、**重点**和可移植的 Markdown 内容。'.repeat(8)}\n\n- 第一项任务\n- 第二项任务\n\n`;
let source = '# 100KB Markdown 基准\n\n';
for (let i = 1; Buffer.byteLength(source + block(i)) <= 102400; i++) source += block(i);
source += ' '.repeat(102400 - Buffer.byteLength(source));
const measure = (fn: () => unknown) => {
  for (let i = 0; i < 3; i++) fn();
  const samples = Array.from({ length: 20 }, () => {
    const start = performance.now();
    fn();
    return performance.now() - start;
  }).sort((a, b) => a - b);
  return {
    medianMs: Number(((samples[9] + samples[10]) / 2).toFixed(2)),
    p95Ms: Number(samples[18].toFixed(2)),
    runs: samples.length,
  };
};
const report = {
  bytes: Buffer.byteLength(source),
  characters: source.length,
  lines: source.split('\n').length,
  runtime: process.version,
  platform: `${process.platform}/${process.arch}`,
  headings: measure(() => getHeadings(source)),
  previewServerRender: measure(() => renderToStaticMarkup(<MarkdownPreview value={source} />)),
  limitation: 'Node 热运行基准；不包含浏览器布局、输入到绘制延迟、网络或异步图表渲染。',
};
fs.mkdirSync('.benchmarks', { recursive: true });
fs.writeFileSync('.benchmarks/100kb.md', source);
fs.writeFileSync('.benchmarks/report.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
