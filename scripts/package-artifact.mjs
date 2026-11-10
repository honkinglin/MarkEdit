import { readFile } from 'node:fs/promises';
export async function packageArtifact() {
  const pkg = JSON.parse(await readFile('packages/editor/package.json', 'utf8'));
  if (!/^[a-z0-9][a-z0-9-]*$/.test(pkg.name)) throw new Error('Expected an unscoped package name.');
  if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(pkg.version))
    throw new Error('Expected a stable major.minor.patch version.');
  return {
    pkg,
    filename: `${pkg.name}-${pkg.version}.tgz`,
    path: `.benchmarks/${pkg.name}-${pkg.version}.tgz`,
  };
}
