import { MarkdownPreview as Preview } from '../../packages/editor/src/components/MarkdownPreview';
export function MarkdownPreview({ value }: { value: string }) {
  return <Preview value={value} headingPrefix="" />;
}
