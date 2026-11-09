import { memo } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { remarkHeadings } from '../lib/headings';
const plugins = [remarkGfm, remarkHeadings];
export const MarkdownPreview = memo(function MarkdownPreview({ value }: { value: string }) {
  return (
    <article className="markdown-body" aria-label="Markdown 预览">
      <Markdown remarkPlugins={plugins} skipHtml>
        {value}
      </Markdown>
    </article>
  );
});
