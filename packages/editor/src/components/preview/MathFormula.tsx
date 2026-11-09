import { useEffect, useState } from 'react';
export function MathFormula({ source, display }: { source: string; display: boolean }) {
  const [result, setResult] = useState<{ key: string; html?: string; error?: string } | null>(null);
  const key = `${display}:${source}`;
  useEffect(() => {
    let canceled = false;
    void import('../../lib/math')
      .then((module) => {
        if (canceled) return;
        setResult({ key, html: module.renderFormula(source, display) });
      })
      .catch((error: unknown) => {
        if (!canceled)
          setResult({ key, error: error instanceof Error ? error.message : '公式加载失败' });
      });
    return () => {
      canceled = true;
    };
  }, [source, display, key]);
  const current = result?.key === key ? result : null;
  if (current?.error)
    return (
      <span className="render-error" role="status" title={current.error}>
        公式无法渲染：<code>{source}</code>
      </span>
    );
  return current?.html ? (
    <span
      className={display ? 'formula-block' : 'formula'}
      dangerouslySetInnerHTML={{ __html: current.html }}
    />
  ) : (
    <span className="formula-loading">{source}</span>
  );
}
