import hljs from 'highlight.js/lib/core';
const loaders = {
  javascript: () => import('highlight.js/lib/languages/javascript'),
  typescript: () => import('highlight.js/lib/languages/typescript'),
  python: () => import('highlight.js/lib/languages/python'),
  json: () => import('highlight.js/lib/languages/json'),
  css: () => import('highlight.js/lib/languages/css'),
  xml: () => import('highlight.js/lib/languages/xml'),
  bash: () => import('highlight.js/lib/languages/bash'),
  sql: () => import('highlight.js/lib/languages/sql'),
  markdown: () => import('highlight.js/lib/languages/markdown'),
};
const aliases: Record<string, string> = {
  js: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  py: 'python',
  html: 'xml',
  sh: 'bash',
  shell: 'bash',
  md: 'markdown',
};
const pending = new Map<string, Promise<void>>();
export async function highlightCode(source: string, language: string): Promise<string | null> {
  const name = aliases[language.toLowerCase()] ?? language.toLowerCase();
  const loader = loaders[name as keyof typeof loaders];
  if (!loader || source.length > 100_000) return null;
  if (!pending.has(name)) {
    pending.set(
      name,
      loader()
        .then((module) => {
          hljs.registerLanguage(name, module.default);
        })
        .catch((error) => {
          pending.delete(name);
          throw error;
        }),
    );
  }
  await pending.get(name);
  return hljs.highlight(source, { language: name, ignoreIllegals: true }).value;
}
