import { messagesFor } from '../i18n';
import type { EditorLocale } from '../i18n';
import katex from 'katex';
import './math.css';
export function renderFormula(source: string, display: boolean, locale: EditorLocale = 'en') {
  if (source.length > 10_000)
    throw new Error(messagesFor(locale).formulasMustNotExceed10000Characters);
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
