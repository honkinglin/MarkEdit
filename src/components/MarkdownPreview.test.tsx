import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MarkdownPreview } from './MarkdownPreview';
describe('Markdown 预览', () => {
  it('渲染 GFM 表格和任务列表', () => {
    const html = renderToStaticMarkup(
      <MarkdownPreview value={'| A | B |\n| --- | --- |\n| 1 | 2 |\n\n- [x] 完成'} />,
    );
    expect(html).toContain('<table>');
    expect(html).toContain('type="checkbox"');
    expect(html).toContain('checked=""');
  });
  it('不执行原始 HTML，不保留 javascript 链接', () => {
    const html = renderToStaticMarkup(
      <MarkdownPreview
        value={
          '<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>\n\n[危险](javascript:alert%281%29)'
        }
      />,
    );
    expect(html).not.toContain('<script');
    expect(html).not.toContain('onerror');
    expect(html).not.toContain('javascript:');
  });
});
