import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { verifyReleaseIntegrity } from './release-integrity.mjs';
import { spawnSync } from 'node:child_process';

const manifest = JSON.parse(await readFile('.benchmarks/release-manifest.json', 'utf8'));
// Validate the filename before reading a path supplied by the manifest.
assert.match(manifest.filename, /^react-markedit-\d+\.\d+\.\d+\.tgz$/);
const file = `.benchmarks/${manifest.filename}`;
verifyReleaseIntegrity(manifest, await readFile(file), {
  commit: process.env.GITHUB_SHA,
  tag: process.env.RELEASE_TAG,
});
if (!process.argv.includes('--dry-run')) {
  const lookup = spawnSync(
    'npm',
    [
      'view',
      `${manifest.name}@${manifest.version}`,
      'dist.integrity',
      '--json',
      '--registry=https://registry.npmjs.org/',
    ],
    { encoding: 'utf8' },
  );
  if (lookup.status === 0) {
    assert.equal(
      JSON.parse(lookup.stdout),
      manifest.integrity,
      'This version already exists with different contents. Bump the version.',
    );
    console.log(`${manifest.name}@${manifest.version} already exists with the verified integrity.`);
    process.exit(0);
  }
  if (!lookup.stderr.includes('E404'))
    throw new Error('Registry lookup failed; publication was not attempted.');
}
const args = [
  'publish',
  file,
  '--ignore-scripts',
  '--access',
  'public',
  '--registry=https://registry.npmjs.org/',
];
if (process.argv.includes('--dry-run')) args.push('--dry-run');
const result = spawnSync('npm', args, { stdio: 'inherit' });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
