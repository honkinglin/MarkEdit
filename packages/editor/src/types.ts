import type { CSSProperties, Ref } from 'react';
import type { Extension } from '@codemirror/state';
import type { Heading } from './lib/headings';
import type { UploadImage } from './lib/insertions';
export type EditorTheme = 'light' | 'dark';
export type EditorMode = 'edit' | 'split' | 'preview';
export type ToolbarItem =
  'bold' | 'italic' | 'heading' | 'quote' | 'list' | 'link' | 'image' | 'code' | 'table';
export interface MarkdownEditorHandle {
  focus(): void;
  getValue(): string;
  /** Replaces the current selection. No-op in read-only mode. */
  insertText(text: string): void;
  jumpToLine(line: number): void;
}
interface CommonEditorProps {
  readOnly?: boolean;
  theme?: EditorTheme;
  mode?: EditorMode;
  toolbar?: boolean | readonly ToolbarItem[];
  extensions?: Extension[];
  uploadImage?: UploadImage;
  syncScroll?: boolean;
  height?: CSSProperties['height'];
  className?: string;
  style?: CSSProperties;
  ariaLabel?: string;
  ref?: Ref<MarkdownEditorHandle>;
}
/** Controlledness is fixed at mount. Use a new key to start a different document. */
export type MarkdownEditorProps = CommonEditorProps &
  (
    | { value: string; defaultValue?: never; onChange: (value: string) => void }
    | { value?: never; defaultValue?: string; onChange?: (value: string) => void }
  );
export interface MarkdownPreviewProps {
  value: string;
  theme?: EditorTheme;
  className?: string;
  style?: CSSProperties;
  /** Defaults to a unique prefix per mounted preview. Use getHeadings(value, prefix) for a matching outline. */
  headingPrefix?: string;
  /** Receives headings from the committed preview without parsing Markdown again. */
  onHeadings?: (headings: Heading[]) => void;
}
