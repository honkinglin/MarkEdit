import type { Root } from 'mdast';
import { visit } from 'unist-util-visit';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import { remarkHeadings } from './headings';

export function remarkSourceMap() {
  return (tree: Root) => {
    visit(tree, (node) => {
      if (node.type === 'math' || node.type === 'inlineMath') {
        node.data = {
          ...node.data,
          hName: 'span',
          hProperties: {
            className: [
              'formula-source',
              node.type === 'math' ? 'formula-display' : 'formula-inline',
            ],
          },
          hChildren: [{ type: 'text', value: node.value }],
        };
      }
      if (
        node.position &&
        node.type !== 'root' &&
        node.type !== 'text' &&
        node.type !== 'inlineMath'
      ) {
        node.data = {
          ...node.data,
          hProperties: {
            ...node.data?.hProperties,
            'data-source-line': node.position.start.line,
            'data-source-end': node.position.end.line,
          },
        };
      }
    });
  };
}
export const previewPlugins = [remarkGfm, remarkMath, remarkHeadings, remarkSourceMap];
