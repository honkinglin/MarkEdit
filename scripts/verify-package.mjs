import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import path from 'node:path';
import postcss from 'postcss';
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
const entry = await readFile(path.join(base, 'index.js'), 'utf8');
assert.match(entry, /from "react"/);
assert.match(entry, /from "react\/jsx-runtime"/);
await access(path.join(base, 'index.d.ts'));
await access(path.join(base, 'licenses/katex-LICENSE.txt'));
console.log(
  'Package verified: scoped CSS, font assets, declarations, external React, KaTeX license.',
);
