// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { usePreviewValue } from './usePreviewValue';
let value = '';
let root: ReturnType<typeof createRoot>;
function Harness({ text, id }: { text: string; id: string }) {
  value = usePreviewValue(text, id);
  return null;
}
afterEach(async () => {
  await act(async () => root.unmount());
  vi.useRealTimers();
});
describe('长文预览调度', () => {
  it('合并连续输入，切换文档时不复用另一份文档的快照', async () => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    vi.useFakeTimers();
    root = createRoot(document.createElement('div'));
    const large = 'x'.repeat(30001);
    await act(async () => root.render(<Harness text={large} id="A" />));
    await act(async () => root.render(<Harness text={large + 'first'} id="A" />));
    expect(value).toBe(large);
    await act(async () => {
      vi.advanceTimersByTime(100);
    });
    await act(async () => root.render(<Harness text={large + 'latest'} id="A" />));
    await act(async () => {
      vi.advanceTimersByTime(180);
    });
    expect(value).toBe(large + 'latest');
    await act(async () => root.render(<Harness text={large + 'other document'} id="B" />));
    expect(value).toBe(large + 'other document');
  });
});
