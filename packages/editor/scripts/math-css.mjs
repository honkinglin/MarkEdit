import { readFile, writeFile, cp, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import postcss from 'postcss';
const source = path.dirname(fileURLToPath(import.meta.resolve('katex')));
const css = postcss.parse(await readFile(path.join(source, 'katex.min.css'), 'utf8'));
css.walkRules((rule) => {
  rule.selectors = rule.selectors.map((selector) => `.markedit ${selector}`);
});
await writeFile('dist/lib/math.css', css.toString());
await cp(path.join(source, 'fonts'), 'dist/lib/fonts', { recursive: true });

await mkdir('dist/licenses', { recursive: true });
await cp(path.join(source, '..', 'LICENSE'), 'dist/licenses/katex-LICENSE.txt');
