import { useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import type { Ref } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { EditorView } from '@codemirror/view';
import { Bold, Italic, Heading2, Quote, List, Link, Code2, Table2, ImagePlus } from 'lucide-react';
import { InsertDialog } from './InsertDialog';
import type { InsertKind } from './InsertDialog';
import { imageFromFile } from '../lib/insertions';
import type { UploadImage } from '../lib/insertions';

const formats = [
  { label: '加粗', icon: Bold, before: '**', after: '**', placeholder: '粗体文字' },
  { label: '斜体', icon: Italic, before: '*', after: '*', placeholder: '斜体文字' },
  { label: '标题', icon: Heading2, before: '## ', after: '', placeholder: '标题', block: true },
  { label: '引用', icon: Quote, before: '> ', after: '', placeholder: '引用内容', block: true },
  { label: '列表', icon: List, before: '- ', after: '', placeholder: '列表项目', block: true },
];
const dialogs = [
  { kind: 'link', label: '链接', icon: Link },
  { kind: 'image', label: '图片', icon: ImagePlus },
  { kind: 'code', label: '代码块', icon: Code2 },
  { kind: 'table', label: '表格', icon: Table2 },
] as const;
export interface MarkdownEditorHandle {
  jumpToLine: (line: number) => void;
  scrollToLine: (line: number) => void;
}
export function MarkdownEditor({
  value,
  onChange,
  dark,
  disabled = false,
  ref,
  onScrollLine,
  uploadImage,
}: {
  value: string;
  onChange: (value: string) => void;
  dark: boolean;
  disabled?: boolean;
  ref?: Ref<MarkdownEditorHandle>;
  onScrollLine?: (line: number) => void;
  uploadImage?: UploadImage;
}) {
  const view = useRef<EditorView | null>(null);
  const uploads = useRef(new Set<{ position: number }>());
  const [insertKind, setInsertKind] = useState<InsertKind | null>(null);
  const [selected, setSelected] = useState('');
  const [notice, setNotice] = useState('');
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const extensions = useMemo(
    () => [
      markdown(),
      EditorView.lineWrapping,
      EditorView.contentAttributes.of({ 'aria-label': 'Markdown 源码' }),
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
    [disabled, onScrollLine, uploadImage],
  );

  async function insertFile(file: File, editor: EditorView, position: number) {
    if (!uploadImage) {
      setNotice('当前工作台支持图片 URL；点击图片按钮输入地址。');
      return;
    }
    const bookmark = { position };
    uploads.current.add(bookmark);
    setNotice('正在上传图片…');
    try {
      const text = await imageFromFile(file, uploadImage);
      if (!mounted.current || view.current !== editor) return;
      editor.dispatch({
        changes: { from: bookmark.position, insert: `\n${text}\n` },
        userEvent: 'input',
      });
      setNotice('图片已插入');
    } catch (error) {
      if (mounted.current)
        setNotice(error instanceof Error ? error.message : '图片上传失败，请重试');
    } finally {
      uploads.current.delete(bookmark);
    }
  }
  useImperativeHandle(
    ref,
    () => ({
      jumpToLine(line) {
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
    [],
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
    <section className="source-pane" aria-label="编辑区域">
      <div className="format-toolbar" role="group" aria-label="文本格式">
        {formats.map((item) => (
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
        {dialogs.map((item) => (
          <button
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
      {notice && (
        <div className="editor-notice" role="status">
          {notice}
          <button onClick={() => setNotice('')} aria-label="关闭图片提示">
            ×
          </button>
        </div>
      )}
      <div className="code-area">
        <CodeMirror
          height="100%"
          style={{ height: '100%' }}
          editable={!disabled}
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
        kind={insertKind}
        selected={selected}
        onClose={() => setInsertKind(null)}
        onInsert={insert}
      />
    </section>
  );
}
