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
export function annotateHeadings(tree: Root, prefix = ''): Heading[] {
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
    node.data = { ...node.data, hProperties: { ...node.data?.hProperties, id } };
    headings.push({
      id,
      text: text || '无标题',
      depth: node.depth,
      line: node.position?.start.line ?? 1,
    });
  });
  return headings;
}
export function getHeadings(value: string, prefix = '') {
  return annotateHeadings(parser.parse(value), prefix);
}
export function remarkHeadings(options?: { prefix?: string }) {
  return (tree: Root) => {
    annotateHeadings(tree, options?.prefix);
  };
}
