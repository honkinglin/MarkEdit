import { messagesFor } from '../i18n';
import { useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import type { Ref } from 'react';
import type { EditorLocale } from '../i18n';
import CodeMirror, { ExternalChange } from '@uiw/react-codemirror';
import { EditorState, Prec, type Extension } from '@codemirror/state';
import type { ToolbarItem } from '../types';
import { markdownLanguage, markdownKeymap, pasteURLAsLink } from '@codemirror/lang-markdown';
import { EditorView, keymap } from '@codemirror/view';
import { Bold, Italic, Heading2, Quote, List, Link, Code2, Table2, ImagePlus } from 'lucide-react';
import { InsertDialog } from './InsertDialog';
import type { InsertKind } from './InsertDialog';
import { imageFromFile } from '../lib/insertions';
import type { UploadImage } from '../lib/insertions';

const noExtensions: Extension[] = [];
export interface EditorInputHandle {
  focus: () => void;
  getValue: () => string;
  insertText: (text: string) => void;
  reconcile: (text: string) => void;
  jumpToLine: (line: number) => void;
  scrollToLine: (line: number) => void;
}
export function EditorInput({
  value,
  onChange,
  dark,
  disabled = false,
  ref,
  onScrollLine,
  uploadImage,
  toolbar = true,
  extensions: extraExtensions = noExtensions,
  ariaLabel: ariaLabelProp,
  portalDialogs = false,
  locale = 'en',
}: {
  value: string;
  onChange: (value: string) => void;
  dark: boolean;
  disabled?: boolean;
  ref?: Ref<EditorInputHandle>;
  onScrollLine?: (line: number) => void;
  uploadImage?: UploadImage;
  toolbar?: boolean | readonly ToolbarItem[];
  extensions?: Extension[];
  ariaLabel?: string;
  portalDialogs?: boolean;
  locale?: EditorLocale;
}) {
  const messages = messagesFor(locale);
  const ariaLabel = ariaLabelProp ?? messages.markdownSource;
  const formats = [
    {
      id: 'bold',
      label: messages.bold,
      icon: Bold,
      before: '**',
      after: '**',
      placeholder: messages.boldText,
    },
    {
      id: 'italic',
      label: messages.italic,
      icon: Italic,
      before: '*',
      after: '*',
      placeholder: messages.italicText,
    },
    {
      id: 'heading',
      label: messages.heading,
      icon: Heading2,
      before: '## ',
      after: '',
      placeholder: messages.heading,
      block: true,
    },
    {
      id: 'quote',
      label: messages.quote,
      icon: Quote,
      before: '> ',
      after: '',
      placeholder: messages.quotedText,
      block: true,
    },
    {
      id: 'list',
      label: messages.list,
      icon: List,
      before: '- ',
      after: '',
      placeholder: messages.listItem,
      block: true,
    },
  ];
  const dialogs = [
    { kind: 'link', label: messages.link, icon: Link },
    { kind: 'image', label: messages.image, icon: ImagePlus },
    { kind: 'code', label: messages.codeBlock, icon: Code2 },
    { kind: 'table', label: messages.table, icon: Table2 },
  ] as const;
  const view = useRef<EditorView | null>(null);
  const uploads = useRef(new Set<{ position: number }>());
  const [insertKind, setInsertKind] = useState<InsertKind | null>(null);
  const [selected, setSelected] = useState('');
  const [notice, setNotice] = useState('');
  const mounted = useRef(true);
  const locked = useRef(disabled);
  locked.current = disabled;
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (disabled) setInsertKind(null);
  }, [disabled]);

  const extensions = useMemo(
    () => [
      ...extraExtensions,
      EditorState.phrases.of(messages.codeMirrorPhrases),
      // Markdown-only syntax support avoids eagerly loading HTML/CSS/JS parsers.
      markdownLanguage,
      Prec.high(keymap.of(markdownKeymap)),
      pasteURLAsLink,
      EditorView.lineWrapping,
      EditorView.contentAttributes.of({ 'aria-label': ariaLabel }),
      EditorView.updateListener.of((update) => {
        if (update.docChanged)
          for (const item of uploads.current)
            item.position = update.changes.mapPos(item.position, 1);
      }),
      EditorView.domEventHandlers({
        scroll(_event, editor) {
          if (
            editor.scrollDOM.scrollHeight > editor.scrollDOM.clientHeight &&
            editor.scrollDOM.scrollTop + editor.scrollDOM.clientHeight >=
              editor.scrollDOM.scrollHeight - 2
          ) {
            onScrollLine?.(editor.state.doc.lines + 1);
            return;
          }
          const block = editor.lineBlockAtHeight(editor.scrollDOM.scrollTop);
          const line = editor.state.doc.lineAt(block.from).number;
          onScrollLine?.(
            line +
              Math.max(0, (editor.scrollDOM.scrollTop - block.top) / Math.max(1, block.height)),
          );
        },
        paste(event, editor) {
          const file = Array.from(event.clipboardData?.files ?? []).find((file) =>
            file.type.startsWith('image/'),
          );
          if (!file || disabled) return false;
          event.preventDefault();
          void insertFile(file, editor, editor.state.selection.main.to);
          return true;
        },
        drop(event, editor) {
          const file = Array.from(event.dataTransfer?.files ?? []).find((file) =>
            file.type.startsWith('image/'),
          );
          if (!file || disabled) return false;
          event.preventDefault();
          void insertFile(
            file,
            editor,
            editor.posAtCoords({ x: event.clientX, y: event.clientY }) ??
              editor.state.selection.main.to,
          );
          return true;
        },
        dragover(event) {
          if (event.dataTransfer?.types.includes('Files')) {
            event.preventDefault();
            return true;
          }
          return false;
        },
      }),
    ],
    [disabled, onScrollLine, uploadImage, extraExtensions, ariaLabel, locale],
  );

  async function insertFile(file: File, editor: EditorView, position: number) {
    if (!uploadImage) {
      setNotice(messages.imageUrlHint);
      return;
    }
    const bookmark = { position };
    uploads.current.add(bookmark);
    setNotice(messages.uploadingImage);
    try {
      const text = await imageFromFile(file, uploadImage, locale);
      if (!mounted.current || view.current !== editor || locked.current) return;
      editor.dispatch({
        changes: { from: bookmark.position, insert: `\n${text}\n` },
        userEvent: 'input',
      });
      setNotice(messages.imageInserted);
    } catch (error) {
      if (mounted.current)
        setNotice(
          error instanceof Error ? error.message : messages.imageUploadFailedPleaseTryAgain,
        );
    } finally {
      uploads.current.delete(bookmark);
    }
  }
  useImperativeHandle(
    ref,
    () => ({
      focus() {
        view.current?.focus();
      },
      getValue() {
        return view.current?.state.doc.toString() ?? value;
      },
      insertText(text) {
        insert(text);
      },
      reconcile(text) {
        const editor = view.current;
        if (editor && editor.state.doc.toString() !== text)
          editor.dispatch({
            changes: { from: 0, to: editor.state.doc.length, insert: text },
            annotations: ExternalChange.of(true),
          });
      },
      jumpToLine(line) {
        if (!Number.isFinite(line)) return;
        const editor = view.current;
        if (!editor) return;
        const position = editor.state.doc.line(
          Math.max(1, Math.min(Math.floor(line), editor.state.doc.lines)),
        ).from;
        editor.dispatch({
          selection: { anchor: position },
          effects: EditorView.scrollIntoView(position, { y: 'start' }),
        });
        editor.focus();
      },
      scrollToLine(line) {
        if (!Number.isFinite(line)) return;
        const editor = view.current;
        if (!editor) return;
        if (line > editor.state.doc.lines) {
          editor.scrollDOM.scrollTop = editor.scrollDOM.scrollHeight;
          return;
        }
        const bounded = Math.max(1, Math.min(line, editor.state.doc.lines));
        const position = editor.state.doc.line(Math.floor(bounded)).from;
        const block = editor.lineBlockAt(position);
        editor.scrollDOM.scrollTop = block.top + (bounded - Math.floor(bounded)) * block.height;
      },
    }),
    [disabled, value],
  );
  function insert(text: string, block = false, selection?: { anchor: number; head: number }) {
    const editor = view.current;
    if (!editor || disabled) return;
    const { from, to } = editor.state.selection.main;
    const prefix = block && from > 0 && editor.state.sliceDoc(from - 1, from) !== '\n' ? '\n' : '';
    const suffix =
      block && to < editor.state.doc.length && editor.state.sliceDoc(to, to + 1) !== '\n'
        ? '\n'
        : '';
    editor.dispatch({
      changes: { from, to, insert: prefix + text + suffix },
      selection: selection
        ? { anchor: selection.anchor + prefix.length, head: selection.head + prefix.length }
        : { anchor: from + prefix.length + text.length },
      userEvent: 'input',
    });
    editor.focus();
  }
  function format(item: (typeof formats)[number]) {
    const editor = view.current;
    if (!editor) return;
    const { from, to } = editor.state.selection.main;
    const selection = editor.state.sliceDoc(from, to) || item.placeholder;
    insert(item.before + selection + item.after, item.block, {
      anchor: from + item.before.length,
      head: from + item.before.length + selection.length,
    });
  }
  return (
    <section className="source-pane" aria-label={messages.editingArea}>
      {toolbar !== false && (
        <div className="format-toolbar" role="group" aria-label={messages.textFormatting}>
          {formats
            .filter(
              (item) =>
                toolbar === true ||
                (Array.isArray(toolbar) && toolbar.includes(item.id as ToolbarItem)),
            )
            .map((item) => (
              <button
                type="button"
                key={item.label}
                disabled={disabled}
                title={item.label}
                aria-label={item.label}
                onClick={() => format(item)}
              >
                <item.icon size={17} />
              </button>
            ))}
          {dialogs
            .filter(
              (item) => toolbar === true || (Array.isArray(toolbar) && toolbar.includes(item.kind)),
            )
            .map((item) => (
              <button
                type="button"
                key={item.kind}
                disabled={disabled}
                title={item.label}
                aria-label={item.label}
                onClick={() => {
                  const editor = view.current;
                  if (!editor) return;
                  const { from, to } = editor.state.selection.main;
                  setSelected(editor.state.sliceDoc(from, to));
                  setInsertKind(item.kind);
                }}
              >
                <item.icon size={17} />
              </button>
            ))}
          <span className="toolbar-hint">Markdown</span>
        </div>
      )}
      {notice && (
        <div className="editor-notice" role="status">
          {notice}
          <button
            type="button"
            onClick={() => setNotice('')}
            aria-label={messages.dismissImageNotice}
          >
            ×
          </button>
        </div>
      )}
      <div className="code-area">
        <CodeMirror
          height="100%"
          style={{ height: '100%' }}
          editable={!disabled}
          readOnly={disabled}
          value={value}
          onChange={onChange}
          extensions={extensions}
          theme={dark ? 'dark' : 'light'}
          onCreateEditor={(editor) => {
            view.current = editor;
          }}
          basicSetup={{
            foldGutter: false,
            highlightActiveLine: false,
            highlightActiveLineGutter: false,
          }}
        />
      </div>
      <InsertDialog
        portal={portalDialogs}
        dark={dark}
        kind={disabled ? null : insertKind}
        selected={selected}
        locale={locale}
        onClose={() => setInsertKind(null)}
        onInsert={insert}
      />
    </section>
  );
}
