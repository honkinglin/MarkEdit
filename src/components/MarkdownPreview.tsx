import { MarkdownPreview as Preview } from '../../packages/editor/src/components/MarkdownPreview';
import type { Heading } from '../lib/headings';
import type { EditorLocale } from '../../packages/editor/src/i18n';
export function MarkdownPreview({
  value,
  onHeadings,
  locale,
}: {
  value: string;
  onHeadings?: (headings: Heading[]) => void;
  locale?: EditorLocale;
}) {
  return <Preview value={value} headingPrefix="" onHeadings={onHeadings} locale={locale} />;
}
