// @vitest-environment jsdom
import { act, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it, vi } from 'vitest';
import { MarkdownPreview } from './MarkdownPreview';
import { getHeadings } from '../lib/headings';

it('reports committed headings with matching anchors and source lines after updates', async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  const host = document.createElement('div');
  const root = createRoot(host);
  const receive = vi.fn();
  const source = '# **One**\n\n## One\n\n## One\n\n```text\n# Not a heading\n```\n\n> ### Quoted';
  try {
    await act(async () =>
      root.render(<MarkdownPreview value={source} headingPrefix="a-" onHeadings={receive} />),
    );
    expect(receive).toHaveBeenLastCalledWith(getHeadings(source, 'a-'));
    for (const heading of receive.mock.lastCall![0]) {
      expect(host.querySelector(`[id="${heading.id}"]`)?.getAttribute('data-source-line')).toBe(
        String(heading.line),
      );
    }
    await act(async () =>
      root.render(<MarkdownPreview value="# 新文档" headingPrefix="b-" onHeadings={receive} />),
    );
    expect(receive).toHaveBeenLastCalledWith(getHeadings('# 新文档', 'b-'));
    await act(async () =>
      root.render(<MarkdownPreview value="No headings" headingPrefix="b-" onHeadings={receive} />),
    );
    expect(receive).toHaveBeenLastCalledWith([]);
  } finally {
    await act(async () => root.unmount());
  }
});

it('does not loop when an inline heading callback updates parent state', async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  const root = createRoot(document.createElement('div'));
  const notify = vi.fn();
  function Parent({ value }: { value: string }) {
    const [, setOutline] = useState<unknown>(null);
    return (
      <MarkdownPreview
        value={value}
        onHeadings={(headings) => {
          notify(headings);
          setOutline(headings);
        }}
      />
    );
  }
  try {
    await act(async () => root.render(<Parent value="# First" />));
    expect(notify).toHaveBeenCalledTimes(1);
    await act(async () => root.render(<Parent value="# Second" />));
    expect(notify).toHaveBeenCalledTimes(2);
  } finally {
    await act(async () => root.unmount());
  }
});
