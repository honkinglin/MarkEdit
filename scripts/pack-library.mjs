import { mkdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
await mkdir('.benchmarks', { recursive: true });
// prepack builds the library even when a maintainer runs npm pack directly.
const result = spawnSync(
  'npm',
  ['pack', '--workspace', 'packages/editor', '--pack-destination', '.benchmarks'],
  { stdio: 'inherit', shell: false },
);
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
