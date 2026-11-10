import { messages } from '../../i18n';
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
          type="button"
          onClick={() => {
            if (!navigator.clipboard) {
              setCopied(messages.copyFailedSelectAndCopyManually);
              return;
            }
            void navigator.clipboard
              .writeText(source)
              .then(() => setCopied(messages.copied))
              .catch(() => setCopied(messages.copyFailedSelectAndCopyManually));
          }}
        >
          {copied || messages.copyCode}
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
