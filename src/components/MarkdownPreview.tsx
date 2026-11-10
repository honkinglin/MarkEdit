import { MarkdownPreview as Preview } from '../../packages/editor/src/components/MarkdownPreview';
import type { Heading } from '../lib/headings';
export function MarkdownPreview({
  value,
  onHeadings,
}: {
  value: string;
  onHeadings?: (headings: Heading[]) => void;
}) {
  return <Preview value={value} headingPrefix="" onHeadings={onHeadings} />;
}
