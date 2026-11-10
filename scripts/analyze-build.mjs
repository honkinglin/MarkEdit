import { build } from 'vite';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
const label = process.argv[2] ?? 'current';
const budget = JSON.parse(await readFile('performance-budget.json', 'utf8'));
if (!/^[a-z0-9-]+$/i.test(label)) throw new Error('Use an alphanumeric report label.');
await build({
  plugins: [
    {
      name: 'markedit-build-report',
      async writeBundle(_options, bundle) {
        const chunks = Object.values(bundle).filter((item) => item.type === 'chunk');
        const entry = chunks.find((chunk) => chunk.isEntry);
        const reachable = new Set();
        const walk = (name) => {
          if (reachable.has(name)) return;
          reachable.add(name);
          for (const child of bundle[name]?.imports ?? []) walk(child);
        };
        walk(entry.fileName);
        const report = {
          label,
          entry: entry.fileName,
          initialJsBytes: 0,
          initialJsGzipBytes: 0,
          chunks: chunks.map((chunk) => ({
            file: chunk.fileName,
            initial: reachable.has(chunk.fileName),
            bytes: Buffer.byteLength(chunk.code),
            gzipBytes: gzipSync(chunk.code).length,
            modules: Object.entries(chunk.modules)
              .map(([id, info]) => ({
                id: id.replace(process.cwd() + '/', ''),
                bytes: info.renderedLength,
              }))
              .sort((a, b) => b.bytes - a.bytes),
          })),
        };
        for (const chunk of report.chunks)
          if (chunk.initial) {
            report.initialJsBytes += chunk.bytes;
            report.initialJsGzipBytes += chunk.gzipBytes;
          }
        await mkdir('.benchmarks', { recursive: true });
        await writeFile(`.benchmarks/bundle-${label}.json`, JSON.stringify(report, null, 2) + '\n');
        if (
          process.argv.includes('--check') &&
          report.initialJsGzipBytes > budget.initialJsGzipBytes
        ) {
          throw new Error(
            `Initial JS exceeds the gzip budget: ${report.initialJsGzipBytes} > ${budget.initialJsGzipBytes} bytes`,
          );
        }
        console.log(
          `Initial JS: ${report.initialJsBytes} bytes / ${report.initialJsGzipBytes} gzip bytes`,
        );
      },
    },
  ],
});
