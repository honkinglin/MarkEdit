import { messages } from '../i18n';
import { memo, useId, useMemo } from 'react';
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
}: MarkdownPreviewProps) {
  const id = useId();
  const prefix = headingPrefix ?? `markedit-${id}-`;
  const plugins = useMemo<PluggableList>(
    () =>
      previewPlugins.map((plugin) =>
        plugin === remarkHeadings ? [remarkHeadings, { prefix }] : plugin,
      ),
    [prefix],
  );
  return (
    <div className={`markedit markedit-preview ${className}`} data-theme={theme} style={style}>
      <article className="markdown-body" aria-label={messages.markdownPreview}>
        <Markdown remarkPlugins={plugins} components={components} skipHtml>
          {value}
        </Markdown>
      </article>
    </div>
  );
});
