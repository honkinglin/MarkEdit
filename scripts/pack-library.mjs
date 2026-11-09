import { mkdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
await mkdir('.benchmarks', { recursive: true });
const result = spawnSync(
  'npm',
  ['pack', '--workspace', '@markedit/react', '--pack-destination', '.benchmarks'],
  { stdio: 'inherit', shell: false },
);
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
