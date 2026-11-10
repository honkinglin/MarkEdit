import { readFile, readdir, mkdir, writeFile, access } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';

const pkg = JSON.parse(await readFile('packages/editor/package.json', 'utf8'));
const lock = JSON.parse(await readFile('package-lock.json', 'utf8'));
await mkdir('.benchmarks', { recursive: true });
// Inventory the resolved production graph. This is evidence for review, not a legal audit.
const notices = [];
for (const [location, item] of Object.entries(lock.packages)) {
  if (!location.includes('node_modules/') || item.dev || item.link) continue;
  const manifest = JSON.parse(await readFile(path.join(location, 'package.json'), 'utf8'));
  const files = (await readdir(location)).filter((name) =>
    /^(licen[cs]e|copying|notice)(\.|$|-)/i.test(name),
  );
  const licenses = [];
  for (const name of files) {
    try {
      licenses.push({ file: name, text: await readFile(path.join(location, name), 'utf8') });
    } catch (error) {
      if (error.code !== 'EISDIR') throw error;
    }
  }
  notices.push({
    name: manifest.name,
    version: manifest.version,
    license: manifest.license ?? null,
    location,
    licenses,
  });
}
notices.sort((a, b) => a.name.localeCompare(b.name) || a.version.localeCompare(b.version));
await writeFile('.benchmarks/third-party-notices.json', JSON.stringify(notices, null, 2) + '\n');
const assets = [];
for (const file of await readdir('dist/assets')) {
  if (!/\.(js|css)$/.test(file)) continue;
  const data = await readFile(path.join('dist/assets', file));
  assets.push({ file, bytes: data.length, gzipBytes: gzipSync(data).length });
}
assets.sort((a, b) => b.bytes - a.bytes);
for (const file of [
  'packages/editor/dist/index.js',
  'packages/editor/dist/index.d.ts',
  'packages/editor/dist/style.css',
])
  await access(file);
const tarball = `.benchmarks/${pkg.name.replace('@', '').replace('/', '-')}-${pkg.version}.tgz`;
const tar = await readFile(tarball);
const consumerLock = JSON.parse(
  await readFile('examples/react-consumer/package-lock.json', 'utf8'),
);
const integrity = 'sha512-' + createHash('sha512').update(tar).digest('base64');
const consumerMatches = consumerLock.packages[`node_modules/${pkg.name}`]?.integrity === integrity;
let remotes = '';
try {
  remotes = execFileSync('git', ['remote'], { encoding: 'utf8' }).trim();
} catch {
  /* Source archives need not include Git. */
}
const blockers = [];
if (pkg.private) blockers.push('组件包仍为 private；未授权公开发布。');
if (!pkg.license || pkg.license === 'UNLICENSED') blockers.push('本项目开源许可尚未确定。');
if (!remotes) blockers.push('尚未配置 Git remote，GitHub CI 无远端执行记录。');
if (!consumerMatches)
  blockers.push('独立示例 lockfile 与当前 tarball 不匹配，请运行 npm run example:setup。');
blockers.push(
  'npm 发布账号、包名可用性与正式 release 仍需确认；Vercel 演示已上线，当前报告不检查线上状态。',
);
const report = {
  generatedAt: new Date().toISOString(),
  package: {
    name: pkg.name,
    version: pkg.version,
    private: pkg.private,
    license: pkg.license ?? null,
  },
  tarball: {
    path: tarball,
    bytes: tar.length,
    sha256: createHash('sha256').update(tar).digest('hex'),
    consumerMatches,
  },
  assets,
  productionDependencies: notices.length,
  missingLicenseMetadata: notices
    .filter((item) => !item.license)
    .map((item) => `${item.name}@${item.version}`),
  readyForPublicRelease: false,
  blockers,
  note: '脚本检查产物与元数据，不代表测试已运行、第三方许可审核完成或线上部署已成功。',
};
await writeFile('.benchmarks/release-report.json', JSON.stringify(report, null, 2) + '\n');
console.log(
  JSON.stringify(
    { tarball: report.tarball, productionDependencies: notices.length, blockers },
    null,
    2,
  ),
);
if (!consumerMatches) process.exitCode = 1;
