import { messagesFor } from '../i18n';
import type { EditorLocale } from '../i18n';
import DOMPurify from 'dompurify';
import mermaid from 'mermaid';
mermaid.initialize({
  startOnLoad: false,
  securityLevel: 'strict',
  theme: 'neutral',
  suppressErrorRendering: true,
  maxTextSize: 50_000,
  maxEdges: 200,
  htmlLabels: false,
  flowchart: { htmlLabels: false },
  secure: [
    'securityLevel',
    'startOnLoad',
    'maxTextSize',
    'maxEdges',
    'suppressErrorRendering',
    'flowchart',
    'htmlLabels',
  ],
});
let sequence = 0;
let queue = Promise.resolve();
export function renderDiagram(
  source: string,
  isCanceled: () => boolean,
  locale: EditorLocale = 'en',
): Promise<string> {
  const work = queue.then(async () => {
    if (isCanceled()) return '';
    const messages = messagesFor(locale);
    if (source.length > 50_000) throw new Error(messages.diagramsMustNotExceed50000Characters);
    if (/%%\s*\{|^\s*---/.test(source)) throw new Error(messages.diagramConfigurationDisabled);
    const container = document.createElement('div');
    container.className = 'mermaid-render-host';
    container.style.cssText =
      'position:fixed;left:-100000px;top:0;width:1200px;visibility:hidden;pointer-events:none';
    container.setAttribute('aria-hidden', 'true');
    document.body.append(container);
    try {
      const { svg } = await mermaid.render(`markedit-diagram-${++sequence}`, source, container);
      return DOMPurify.sanitize(svg, {
        USE_PROFILES: { svg: true, svgFilters: true },
        FORBID_TAGS: ['foreignObject', 'script', 'image', 'a'],
        FORBID_ATTR: ['href', 'xlink:href'],
      });
    } finally {
      container.remove();
    }
  });
  // Mermaid uses shared rendering state; serialize diagrams and recover the queue after invalid input.
  queue = work.then(
    () => undefined,
    () => undefined,
  );
  return work;
}
