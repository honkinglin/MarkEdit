// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useScrollSync } from './useScrollSync';

let root: ReturnType<typeof createRoot>;
let host: HTMLDivElement;
let container: HTMLDivElement;
let api: ReturnType<typeof useScrollSync>;
let frame: FrameRequestCallback | null = null;
const editor = { current: { jumpToLine: vi.fn(), scrollToLine: vi.fn() } };
const preview = { current: null as HTMLDivElement | null };
function Harness({ enabled = true }: { enabled?: boolean }) {
  api = useScrollSync(editor, preview, enabled, 'one\ntwo\nthree\nfour', 'doc');
  return null;
}
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  vi.useFakeTimers();
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    frame = callback;
    return 1;
  });
  vi.stubGlobal('cancelAnimationFrame', () => {
    frame = null;
  });
  host = document.createElement('div');
  container = document.createElement('div');
  container.innerHTML =
    '<article><h1 data-source-line="1">one</h1><p data-source-line="4">four</p></article>';
  Object.defineProperty(container, 'scrollHeight', { value: 500 });
  Object.defineProperty(container, 'clientHeight', { value: 100 });
  vi.spyOn(container.querySelector('p')!, 'getBoundingClientRect').mockReturnValue({
    top: 300,
  } as DOMRect);
  preview.current = container;
  document.body.append(host, container);
  root = createRoot(host);
  await act(async () => root.render(<Harness />));
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  container.remove();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
function tickFrame() {
  const callback = frame;
  frame = null;
  callback?.(0);
}
describe('双向滚动同步', () => {
  it('程序触发的反向滚动不回传，锁释放后允许用户从预览驱动', async () => {
    await act(async () => {
      api.onEditorScroll(4);
      tickFrame();
    });
    expect(container.scrollTop).toBe(300);
    editor.current.scrollToLine.mockClear();
    await act(async () => {
      api.onPreviewScroll();
      tickFrame();
    });
    expect(editor.current.scrollToLine).not.toHaveBeenCalled();
    await act(async () => {
      vi.advanceTimersByTime(101);
      container.scrollTop = 400;
      api.onPreviewScroll();
      tickFrame();
    });
    expect(editor.current.scrollToLine).toHaveBeenCalledWith(5);
  });
  it('关闭同步后两边独立滚动', async () => {
    await act(async () => root.render(<Harness enabled={false} />));
    container.scrollTop = 0;
    editor.current.scrollToLine.mockClear();
    await act(async () => {
      api.onEditorScroll(4);
      api.onPreviewScroll();
      tickFrame();
    });
    expect(container.scrollTop).toBe(0);
    expect(editor.current.scrollToLine).not.toHaveBeenCalled();
  });
});
