import { useEffect, useState } from 'react';
export function CodeBlock({ source, language }: { source: string; language: string }) {
  const [result, setResult] = useState<{
    source: string;
    language: string;
    html: string | null;
  } | null>(null);
  const [copied, setCopied] = useState('');
  useEffect(() => {
    let canceled = false;
    if (!language || language === 'text' || language === 'plaintext') return;
    void import('../../lib/highlight')
      .then((module) => module.highlightCode(source, language))
      .then((html) => {
        if (!canceled) setResult({ source, language, html });
      })
      .catch(() => {
        if (!canceled) setResult({ source, language, html: null });
      });
    return () => {
      canceled = true;
    };
  }, [source, language]);
  const html = result?.source === source && result.language === language ? result.html : null;
  return (
    <div className="code-block">
      <div className="code-caption">
        <span>{language || 'text'}</span>
        <button
          onClick={() => {
            if (!navigator.clipboard) {
              setCopied('复制失败，请手动选择');
              return;
            }
            void navigator.clipboard
              .writeText(source)
              .then(() => setCopied('已复制'))
              .catch(() => setCopied('复制失败，请手动选择'));
          }}
        >
          {copied || '复制代码'}
        </button>
      </div>
      <pre>
        {html ? (
          <code className="hljs" dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <code>{source}</code>
        )}
      </pre>
    </div>
  );
}
