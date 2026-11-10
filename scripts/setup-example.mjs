import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { packageArtifact } from './package-artifact.mjs';
const artifact = await packageArtifact();
const result = spawnSync('npm', ['install', resolve(artifact.path)], {
  cwd: resolve('examples/react-consumer'),
  stdio: 'inherit',
});
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
