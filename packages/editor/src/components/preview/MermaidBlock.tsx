import { messages } from '../../i18n';
import { useEffect, useState } from 'react';
export function MermaidBlock({ source }: { source: string }) {
  const [result, setResult] = useState<{ source: string; svg?: string; error?: string } | null>(
    null,
  );
  useEffect(() => {
    let canceled = false;
    // Avoid rendering half-written graphs for every keystroke.
    const timer = setTimeout(() => {
      void import('../../lib/mermaid')
        .then((module) => module.renderDiagram(source, () => canceled))
        .then((svg) => {
          if (!canceled) setResult({ source, svg });
        })
        .catch((error: unknown) => {
          if (!canceled)
            setResult({
              source,
              error: error instanceof Error ? error.message : messages.couldNotLoadDiagram,
            });
        });
    }, 250);
    return () => {
      canceled = true;
      clearTimeout(timer);
    };
  }, [source]);
  const current = result?.source === source ? result : null;
  return (
    <div className="mermaid-block">
      {current?.error ? (
        <div className="render-error" role="status">
          <strong>{messages.couldNotRenderDiagram}</strong>
          <p>{current.error}</p>
          <pre>{source}</pre>
        </div>
      ) : current?.svg ? (
        <div
          role="img"
          aria-label={messages.mermaidDiagram}
          dangerouslySetInnerHTML={{ __html: current.svg }}
        />
      ) : (
        <div className="diagram-loading" role="status">
          {messages.drawingDiagram} <pre>{source}</pre>
        </div>
      )}
    </div>
  );
}
