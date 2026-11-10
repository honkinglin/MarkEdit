import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MarkdownPreview } from './MarkdownPreview';
describe('Markdown preview', () => {
  it('渲染 GFM 表格和任务列表', () => {
    const html = renderToStaticMarkup(
      <MarkdownPreview value={'| A | B |\n| --- | --- |\n| 1 | 2 |\n\n- [x] 完成'} />,
    );
    expect(html).toMatch(/<table[ >]/);
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

describe('扩展 Markdown 结构', () => {
  it('公式与代码块保留源码位置，内联公式不产生嵌套 pre', () => {
    const html = renderToStaticMarkup(
      <MarkdownPreview value={'行内 $x^2$\n\n$$\nx + y\n$$\n\n```tsx\nconst n = 1;\n```'} />,
    );
    expect(html).toContain('x^2');
    expect(html).toContain('data-source-line="3"');
    expect(html).toContain('data-source-line="7"');
    expect(html).toContain('preview-code-region');
    expect(html).not.toContain('<pre><pre');
  });
  it('旧流程图语法明确提示迁移，原始 HTML 仍被忽略', () => {
    const html = renderToStaticMarkup(
      <MarkdownPreview
        value={'```flow\na=>start: 开始\n```\n\n<iframe src="https://example.com"></iframe>'}
      />,
    );
    expect(html).toContain('flow syntax is not supported');
    expect(html).not.toContain('<iframe');
  });
});
