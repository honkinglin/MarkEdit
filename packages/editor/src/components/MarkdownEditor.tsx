import { messages } from '../i18n';
import {
  useCallback,
  useImperativeHandle,
  useLayoutEffect,
  useReducer,
  useRef,
  useState,
} from 'react';
import { EditorInput } from './EditorInput';
import type { EditorInputHandle } from './EditorInput';
import { MarkdownPreview } from './MarkdownPreview';
import { usePreviewValue } from '../hooks/usePreviewValue';
import { useScrollSync } from '../hooks/useScrollSync';
import type { MarkdownEditorProps } from '../types';

export function MarkdownEditor({
  value,
  defaultValue = '',
  onChange,
  readOnly = false,
  theme = 'light',
  mode = 'split',
  toolbar = true,
  extensions,
  uploadImage,
  syncScroll = true,
  height = 480,
  className = '',
  style,
  ariaLabel = messages.markdownSource,
  ref,
}: MarkdownEditorProps) {
  const controlled = useRef(value !== undefined).current;
  const [internal, setInternal] = useState(defaultValue);
  const [revision, refresh] = useReducer((n: number) => n + 1, 0);
  const text = controlled ? (value ?? '') : internal;
  const input = useRef<EditorInputHandle>(null);
  const preview = useRef<HTMLDivElement>(null);
  const deferred = usePreviewValue(text);
  const { onEditorScroll, onPreviewScroll } = useScrollSync(
    input,
    preview,
    syncScroll && mode === 'split',
    deferred,
  );
  const change = useCallback(
    (next: string) => {
      if (readOnly) return;
      if (!controlled) setInternal(next);
      else refresh();
      onChange?.(next);
    },
    [controlled, onChange, readOnly],
  );
  // Restore the prop even when a controlled parent rejects an edit without re-rendering.
  useLayoutEffect(() => {
    if (controlled) input.current?.reconcile(text);
  }, [controlled, text, revision]);
  useImperativeHandle(
    ref,
    () => ({
      focus: () => input.current?.focus(),
      getValue: () => text,
      insertText: (next) => {
        if (!readOnly) input.current?.insertText(next);
      },
      jumpToLine: (line) => input.current?.jumpToLine(line),
    }),
    [text, readOnly],
  );
  return (
    <div
      className={`markedit markedit-editor ${className}`}
      data-theme={theme}
      data-mode={mode}
      style={{ height, ...style }}
    >
      <div className="markedit-source" hidden={mode === 'preview'}>
        <EditorInput
          ref={input}
          value={text}
          onChange={change}
          dark={theme === 'dark'}
          disabled={readOnly}
          portalDialogs
          toolbar={toolbar}
          extensions={extensions}
          uploadImage={uploadImage}
          ariaLabel={ariaLabel}
          onScrollLine={onEditorScroll}
        />
      </div>
      <div
        ref={preview}
        className="markedit-preview-scroll"
        hidden={mode === 'edit'}
        onScroll={onPreviewScroll}
      >
        <MarkdownPreview value={deferred} theme={theme} />
      </div>
    </div>
  );
}
