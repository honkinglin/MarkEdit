import { messagesFor } from '../i18n';
import type { EditorLocale } from '../i18n';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import { visit } from 'unist-util-visit';
import { toString } from 'mdast-util-to-string';
import type { Root } from 'mdast';

export interface Heading {
  id: string;
  text: string;
  depth: number;
  line: number;
}
const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMath);
export function annotateHeadings(tree: Root, prefix = '', locale: EditorLocale = 'en'): Heading[] {
  const messages = messagesFor(locale);
  const headings: Heading[] = [];
  const used = new Set<string>();
  visit(tree, 'heading', (node) => {
    const text = toString(node);
    const base =
      prefix +
      'heading-' +
      (text
        .toLowerCase()
        .trim()
        .replace(/[^\p{L}\p{N}\s_-]/gu, '')
        .replace(/\s+/g, '-') || 'section');
    let id = base;
    let suffix = 1;
    while (used.has(id)) id = `${base}-${suffix++}`;
    used.add(id);
    node.data = {
      ...node.data,
      hProperties: {
        ...node.data?.hProperties,
        id,
        'data-heading-text': text || messages.untitled,
      },
    };
    headings.push({
      id,
      text: text || messages.untitled,
      depth: node.depth,
      line: node.position?.start.line ?? 1,
    });
  });
  return headings;
}
export function getHeadings(value: string, prefix = '', locale: EditorLocale = 'en') {
  return annotateHeadings(parser.parse(value), prefix, locale);
}
export function remarkHeadings(options?: { prefix?: string; locale?: EditorLocale }) {
  return (tree: Root) => {
    annotateHeadings(tree, options?.prefix, options?.locale);
  };
}
