import { messages } from '../i18n';
import katex from 'katex';
import './math.css';
export function renderFormula(source: string, display: boolean) {
  if (source.length > 10_000) throw new Error(messages.formulasMustNotExceed10000Characters);
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
