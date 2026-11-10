import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { packageArtifact } from './package-artifact.mjs';

const artifact = await packageArtifact();
const { pkg } = artifact;
assert.equal(pkg.name, 'react-markedit');
assert.notEqual(pkg.private, true, 'The library must be publishable.');
assert.equal(pkg.license, 'MIT');
assert.equal(pkg.repository.url, 'git+https://github.com/honkinglin/MarkEdit.git');
assert.equal(pkg.publishConfig.registry, 'https://registry.npmjs.org/');
assert.equal(pkg.publishConfig.access, 'public');
assert.match(pkg.peerDependencies.react, /^\^19\./);
if (process.env.RELEASE_TAG)
  assert.equal(process.env.RELEASE_TAG, `v${pkg.version}`, 'Tag and package version differ.');
const files = execFileSync('tar', ['-tzf', artifact.path], { encoding: 'utf8' }).trim().split('\n');
assert(
  files.every((file) => /^package\/(dist\/|package\.json$|README\.md$|LICENSE$)/.test(file)),
  'Unexpected file in package.',
);
for (const required of [
  'package.json',
  'README.md',
  'LICENSE',
  'dist/index.js',
  'dist/index.d.ts',
  'dist/style.css',
  'dist/licenses/katex-LICENSE.txt',
])
  assert(files.includes(`package/${required}`), `Missing ${required}`);
assert(
  files.every((file) => !file.split('/').includes('..') && !file.includes('\\')),
  'Unsafe artifact path.',
);
for (const file of files.filter(
  (file) => file.startsWith('package/dist/') || file === 'package/README.md',
)) {
  if (file.endsWith('/')) continue;
  const packedBytes = execFileSync('tar', ['-xOf', artifact.path, file]);
  assert.deepEqual(
    packedBytes,
    await readFile(`packages/editor/${file.slice('package/'.length)}`),
    `Stale artifact file: ${file}`,
  );
}
const packed = JSON.parse(
  execFileSync('tar', ['-xOf', artifact.path, 'package/package.json'], { encoding: 'utf8' }),
);
assert.deepEqual(packed, pkg, 'Tarball metadata differs from the workspace. Repack it.');
assert.equal(
  execFileSync('tar', ['-xOf', artifact.path, 'package/LICENSE'], { encoding: 'utf8' }),
  await readFile('LICENSE', 'utf8'),
);
const data = await readFile(artifact.path);
const integrity = 'sha512-' + createHash('sha512').update(data).digest('base64');
const lock = JSON.parse(await readFile('examples/react-consumer/package-lock.json', 'utf8'));
assert.equal(
  lock.packages[`node_modules/${pkg.name}`]?.integrity,
  integrity,
  'Consumer did not install this tarball.',
);
const notes = `releases/${pkg.version}.md`;
assert((await readFile(notes, 'utf8')).includes(pkg.version), 'Missing versioned release notes.');
const commit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const dirty =
  execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim().length > 0;
const manifest = {
  name: pkg.name,
  version: pkg.version,
  filename: artifact.filename,
  integrity,
  sha256: createHash('sha256').update(data).digest('hex'),
  bytes: data.length,
  commit,
  dirty,
  notes,
};
await writeFile('.benchmarks/release-manifest.json', JSON.stringify(manifest, null, 2) + '\n');
await writeFile('.benchmarks/SHA256SUMS', `${manifest.sha256}  ${artifact.filename}\n`);
console.log(JSON.stringify(manifest, null, 2));
