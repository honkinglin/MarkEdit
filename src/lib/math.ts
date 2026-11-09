import katex from 'katex';
import 'katex/dist/katex.min.css';
export function renderFormula(source: string, display: boolean) {
  if (source.length > 10_000) throw new Error('公式超过 10,000 字符限制');
  return katex.renderToString(source, {
    displayMode: display,
    throwOnError: true,
    trust: false,
    strict: 'error',
    maxExpand: 1000,
    maxSize: 20,
    output: 'htmlAndMathml',
  });
}
