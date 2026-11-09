import { useImperativeHandle, useRef } from 'react';
import type { Ref } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { EditorView } from '@codemirror/view';
import { Bold, Italic, Heading2, Quote, List, Link, Code2, Table2 } from 'lucide-react';
const extensions = [
  markdown(),
  EditorView.lineWrapping,
  EditorView.contentAttributes.of({ 'aria-label': 'Markdown 源码' }),
];
const formats = [
  { label: '加粗', icon: Bold, before: '**', after: '**', placeholder: '粗体文字' },
  { label: '斜体', icon: Italic, before: '*', after: '*', placeholder: '斜体文字' },
  { label: '标题', icon: Heading2, before: '## ', after: '', placeholder: '标题', block: true },
  { label: '引用', icon: Quote, before: '> ', after: '', placeholder: '引用内容', block: true },
  { label: '列表', icon: List, before: '- ', after: '', placeholder: '列表项目', block: true },
  {
    label: '链接',
    icon: Link,
    before: '[',
    after: '](https://example.com)',
    placeholder: '链接文字',
  },
  {
    label: '代码块',
    icon: Code2,
    before: '```text\n',
    after: '\n```',
    placeholder: '代码',
    block: true,
  },
  {
    label: '表格',
    icon: Table2,
    before: '',
    after: '',
    placeholder: '| 标题 | 内容 |\n| --- | --- |\n| 项目 | 描述 |',
    block: true,
  },
];
export interface MarkdownEditorHandle {
  jumpToLine: (line: number) => void;
}
export function MarkdownEditor({
  value,
  onChange,
  dark,
  disabled = false,
  ref,
}: {
  value: string;
  onChange: (value: string) => void;
  dark: boolean;
  disabled?: boolean;
  ref?: Ref<MarkdownEditorHandle>;
}) {
  const view = useRef<EditorView | null>(null);
  useImperativeHandle(
    ref,
    () => ({
      jumpToLine(line) {
        const editor = view.current;
        if (!editor) return;
        const position = editor.state.doc.line(
          Math.max(1, Math.min(line, editor.state.doc.lines)),
        ).from;
        editor.dispatch({
          selection: { anchor: position },
          effects: EditorView.scrollIntoView(position, { y: 'start' }),
        });
        editor.focus();
      },
    }),
    [],
  );
  function format(item: (typeof formats)[number]) {
    const editor = view.current;
    if (!editor) return;
    const { from, to } = editor.state.selection.main;
    const selected = editor.state.sliceDoc(from, to) || item.placeholder;
    const prefix =
      item.block && from > 0 && editor.state.sliceDoc(from - 1, from) !== '\n' ? '\n' : '';
    const suffix =
      item.block && to < editor.state.doc.length && editor.state.sliceDoc(to, to + 1) !== '\n'
        ? '\n'
        : '';
    editor.dispatch({
      changes: { from, to, insert: prefix + item.before + selected + item.after + suffix },
      selection: {
        anchor: from + prefix.length + item.before.length,
        head: from + prefix.length + item.before.length + selected.length,
      },
      userEvent: 'input',
    });
    editor.focus();
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
        <span className="toolbar-hint">Markdown</span>
      </div>
      <div className="code-area">
        <CodeMirror
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
    </section>
  );
}
