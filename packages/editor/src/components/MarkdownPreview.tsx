import { messages } from '../i18n';
import { memo, useEffect, useId, useMemo, useRef } from 'react';
import type { MarkdownPreviewProps } from '../types';
import { remarkHeadings } from '../lib/headings';
import type { PluggableList } from 'unified';
import Markdown from 'react-markdown';
import type { Components } from 'react-markdown';
import { previewPlugins } from '../lib/markdown';
import { CodeBlock } from './preview/CodeBlock';
import { MathFormula } from './preview/MathFormula';
import { MermaidBlock } from './preview/MermaidBlock';

const components: Components = {
  pre({ node, children, ...props }) {
    const code = node?.children.find(
      (child) => child.type === 'element' && child.tagName === 'code',
    );
    if (!code || code.type !== 'element') return <pre {...props}>{children}</pre>;
    const source = code.children
      .map((child) => (child.type === 'text' ? child.value : ''))
      .join('')
      .replace(/\n$/, '');
    const classes = Array.isArray(code.properties.className) ? code.properties.className : [];
    const language = String(
      classes.find((name) => String(name).startsWith('language-')) ?? '',
    ).replace('language-', '');
    return (
      <div
        data-source-line={node?.position?.start.line}
        data-source-end={node?.position?.end.line}
        className="preview-code-region"
      >
        {language === 'mermaid' ? (
          <MermaidBlock source={source} />
        ) : language === 'flow' || language === 'seq' ? (
          <>
            <p className="render-error">{messages.unsupportedDiagram(language)}</p>
            <CodeBlock source={source} language="text" />
          </>
        ) : (
          <CodeBlock source={source} language={language} />
        )}
      </div>
    );
  },
  span({ node: _node, className, children, ...props }) {
    if (className?.includes('formula-source'))
      return (
        <span {...props}>
          <MathFormula source={String(children)} display={className.includes('formula-display')} />
        </span>
      );
    return (
      <span {...props} className={className}>
        {children}
      </span>
    );
  },
};
export const MarkdownPreview = memo(function MarkdownPreview({
  value,
  theme = 'light',
  className = '',
  style,
  headingPrefix,
  onHeadings,
}: MarkdownPreviewProps) {
  const article = useRef<HTMLElement>(null);
  const reported = useRef<{ value: string; prefix: string } | null>(null);
  const id = useId();
  const prefix = headingPrefix ?? `markedit-${id}-`;
  const plugins = useMemo<PluggableList>(
    () =>
      previewPlugins.map((plugin) =>
        plugin === remarkHeadings ? [remarkHeadings, { prefix }] : plugin,
      ),
    [prefix],
  );
  useEffect(() => {
    if (!onHeadings || !article.current) {
      reported.current = null;
      return;
    }
    // Inline parent callbacks may set state. Only publish when the preview changes.
    if (reported.current?.value === value && reported.current.prefix === prefix) return;
    reported.current = { value, prefix };
    const nodes = article.current.querySelectorAll<HTMLElement>(
      'h1[data-heading-text],h2[data-heading-text],h3[data-heading-text],h4[data-heading-text],h5[data-heading-text],h6[data-heading-text]',
    );
    onHeadings(
      Array.from(nodes, (node) => ({
        id: node.id,
        text: node.dataset.headingText ?? '',
        depth: Number(node.tagName.slice(1)),
        line: Number(node.dataset.sourceLine ?? 1),
      })),
    );
  }, [value, prefix, onHeadings]);
  return (
    <div className={`markedit markedit-preview ${className}`} data-theme={theme} style={style}>
      <article ref={article} className="markdown-body" aria-label={messages.markdownPreview}>
        <Markdown remarkPlugins={plugins} components={components} skipHtml>
          {value}
        </Markdown>
      </article>
    </div>
  );
});
