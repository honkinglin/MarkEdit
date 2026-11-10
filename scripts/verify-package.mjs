import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import path from 'node:path';
import postcss from 'postcss';
assert.equal(await readFile('packages/editor/LICENSE', 'utf8'), await readFile('LICENSE', 'utf8'));
const base = 'packages/editor/dist';
for (const name of ['style.css', 'lib/math.css']) {
  const file = path.join(base, name);
  const text = await readFile(file, 'utf8');
  postcss.parse(text).walkRules((rule) => {
    assert(
      rule.selectors.every((selector) => selector.startsWith('.markedit')),
      `Unscoped CSS: ${rule.selector}`,
    );
  });
  for (const match of text.matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
    if (!match[1].startsWith('data:')) await access(path.resolve(path.dirname(file), match[1]));
  }
}
// Rollup may move the public entry's implementation into shared chunks.
// Verify imports across its reachable JS graph rather than assuming one file.
const visited = new Set();
async function readModuleGraph(file) {
  if (visited.has(file)) return '';
  visited.add(file);
  const source = await readFile(file, 'utf8');
  const dependencies = [...source.matchAll(/(?:from\s*|import\s*\()\s*["'](\.[^"']+\.js)["']/g)];
  const children = await Promise.all(
    dependencies.map((match) => readModuleGraph(path.resolve(path.dirname(file), match[1]))),
  );
  return [source, ...children].join('\n');
}
const entry = await readModuleGraph(path.resolve(base, 'index.js'));
assert.match(entry, /from "react"/);
assert.match(entry, /from "react\/jsx-runtime"/);
await access(path.join(base, 'index.d.ts'));
await access(path.join(base, 'licenses/katex-LICENSE.txt'));
console.log(
  'Package verified: scoped CSS, font assets, declarations, external React, KaTeX license.',
);
