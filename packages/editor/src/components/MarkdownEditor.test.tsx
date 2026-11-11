// @vitest-environment jsdom
import { act, createRef } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EditorView } from '@codemirror/view';
import { StateField } from '@codemirror/state';
import { MarkdownEditor } from './MarkdownEditor';
import type { MarkdownEditorHandle } from '../types';
let root: ReturnType<typeof createRoot>;
let host: HTMLDivElement;
const first = createRef<MarkdownEditorHandle>();
const second = createRef<MarkdownEditorHandle>();
function view(index = 0) {
  return EditorView.findFromDOM(host.querySelectorAll('.cm-editor')[index] as HTMLElement)!;
}
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
      unobserve() {}
    },
  );
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open');
  };
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '');
  };
  Range.prototype.getClientRects = () => [] as unknown as DOMRectList;
  Range.prototype.getBoundingClientRect = () => new DOMRect();
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
describe('公共 React 编辑器契约', () => {
  it('非受控双实例独立编辑，defaultValue 仅用于首次挂载', async () => {
    const changed = vi.fn();
    const render = (initial: string) => (
      <>
        <MarkdownEditor ref={first} defaultValue={initial} onChange={changed} />
        <MarkdownEditor ref={second} defaultValue="second" />
      </>
    );
    await act(async () => root.render(render('first')));
    await act(async () => first.current!.insertText('hello '));
    expect(first.current!.getValue()).toBe('hello first');
    expect(second.current!.getValue()).toBe('second');
    expect(changed).toHaveBeenCalledWith('hello first');
    await act(async () => root.render(render('ignored')));
    expect(first.current!.getValue()).toBe('hello first');
    const ids = Array.from(document.querySelectorAll('dialog h2')).map((el) => el.id);
    expect(new Set(ids).size).toBe(2);
  });
  it('受控父组件拒绝输入会恢复 prop；外部重置不回调 onChange', async () => {
    const changed = vi.fn();
    await act(async () =>
      root.render(<MarkdownEditor ref={first} value="fixed" onChange={changed} />),
    );
    await act(async () => first.current!.insertText('reject '));
    expect(changed).toHaveBeenCalledWith('reject fixed');
    expect(view().state.doc.toString()).toBe('fixed');
    changed.mockClear();
    await act(async () =>
      root.render(<MarkdownEditor ref={first} value="reset" onChange={changed} />),
    );
    expect(view().state.doc.toString()).toBe('reset');
    expect(changed).not.toHaveBeenCalled();
  });
  it('只读阻止 ref 和工具栏写入，动态切换恢复编辑', async () => {
    await act(async () => root.render(<MarkdownEditor ref={first} defaultValue="safe" readOnly />));
    await act(async () => first.current!.insertText('bad'));
    expect(first.current!.getValue()).toBe('safe');
    expect(view().state.readOnly).toBe(true);
    expect(host.querySelector<HTMLButtonElement>('button[aria-label="Bold"]')!.disabled).toBe(true);
    await act(async () => root.render(<MarkdownEditor ref={first} defaultValue="safe" />));
    await act(async () => first.current!.insertText('ok '));
    expect(first.current!.getValue()).toBe('ok safe');
  });
  it('主题与预览模式切换保留编辑实例、选区和扩展', async () => {
    const field = StateField.define({ create: () => 42, update: (value) => value });
    const extensions = [field];
    await act(async () =>
      root.render(<MarkdownEditor defaultValue="abcdef" extensions={extensions} />),
    );
    const original = view();
    await act(async () => original.dispatch({ selection: { anchor: 2, head: 4 } }));
    await act(async () =>
      root.render(
        <MarkdownEditor
          defaultValue="abcdef"
          theme="dark"
          mode="preview"
          extensions={extensions}
        />,
      ),
    );
    expect(view()).toBe(original);
    expect(view().state.selection.main.from).toBe(2);
    expect(view().state.selection.main.to).toBe(4);
    expect(view().state.field(field)).toBe(42);
  });
  it('按 locale 显示中文控件文案，并可原位切回英文', async () => {
    await act(async () => root.render(<MarkdownEditor defaultValue="# 标题" locale="zh" />));
    const original = view();
    expect(original.state.phrase('Find')).toBe('查找');
    expect(host.querySelector('button[aria-label="粗体"]')).not.toBeNull();
    expect(host.querySelector('article[aria-label="Markdown 预览"]')).not.toBeNull();
    await act(async () =>
      host.querySelector<HTMLButtonElement>('button[aria-label="表格"]')!.click(),
    );
    expect(document.querySelector('dialog h2')?.textContent).toBe('插入表格');
    await act(async () => root.render(<MarkdownEditor defaultValue="# 标题" locale="en" />));
    expect(view()).toBe(original);
    expect(original.state.phrase('Find')).toBe('Find');
    expect(host.querySelector('button[aria-label="Bold"]')).not.toBeNull();
    expect(document.querySelector('dialog h2')?.textContent).toBe('Insert table');
  });
  it('卸载销毁 CodeMirror，重新挂载不复用内容', async () => {
    await act(async () => root.render(<MarkdownEditor ref={first} defaultValue="old" />));
    const destroy = vi.spyOn(view(), 'destroy');
    await act(async () => root.render(null));
    expect(destroy).toHaveBeenCalledOnce();
    expect(first.current).toBeNull();
    await act(async () =>
      root.render(<MarkdownEditor ref={first} defaultValue="new" toolbar={['bold', 'code']} />),
    );
    expect(first.current!.getValue()).toBe('new');
    expect(host.querySelector('button[aria-label="Link"]')).toBeNull();
    expect(host.querySelector('button[aria-label="Code block"]')).not.toBeNull();
  });
  it('异步图片上传完成前切换只读，不插入迟到的内容', async () => {
    let finish!: (url: string) => void;
    const upload = vi.fn(
      () =>
        new Promise<string>((resolve) => {
          finish = resolve;
        }),
    );
    await act(async () =>
      root.render(<MarkdownEditor ref={first} defaultValue="safe" uploadImage={upload} />),
    );
    const paste = new Event('paste', { bubbles: true, cancelable: true });
    Object.defineProperty(paste, 'clipboardData', {
      value: { files: [new File(['image'], 'image.png', { type: 'image/png' })] },
    });
    await act(async () => view().contentDOM.dispatchEvent(paste));
    expect(upload).toHaveBeenCalledOnce();
    await act(async () =>
      root.render(<MarkdownEditor ref={first} defaultValue="safe" readOnly uploadImage={upload} />),
    );
    await act(async () => finish('https://example.com/image.png'));
    expect(first.current!.getValue()).toBe('safe');
  });
  it('多个预览的相同标题拥有独立锚点', async () => {
    await act(async () =>
      root.render(
        <>
          <MarkdownEditor defaultValue="# Same" />
          <MarkdownEditor defaultValue="# Same" />
        </>,
      ),
    );
    const headings = Array.from(host.querySelectorAll('article h1')).map((el) => el.id);
    expect(headings).toHaveLength(2);
    expect(new Set(headings).size).toBe(2);
  });
  it('嵌入宿主 form 时按钮与插入对话框不会提交宿主表单', async () => {
    const submit = vi.fn((event: React.FormEvent) => event.preventDefault());
    await act(async () =>
      root.render(
        <form onSubmit={submit}>
          <MarkdownEditor defaultValue="hello" />
        </form>,
      ),
    );
    await act(async () =>
      host.querySelector<HTMLButtonElement>('button[aria-label="Table"]')!.click(),
    );
    const dialog = document.querySelector('dialog[open]')!;
    expect(dialog).not.toBeNull();
    expect(host.contains(dialog)).toBe(false);
    await act(async () =>
      dialog.querySelector<HTMLButtonElement>('button[type="submit"]')!.click(),
    );
    expect(submit).not.toHaveBeenCalled();
    expect(view().state.doc.toString()).toContain('| Heading 1 |');
  });
});
