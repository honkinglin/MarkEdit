import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MarkdownPreview } from '../components/MarkdownPreview';
import { getHeadings } from './headings';

describe('Markdown AST 目录', () => {
  it('跳过围栏代码与缩进代码，支持 Setext 标题和嵌套标题', () => {
    const headings = getHeadings(
      '# 正文\n\n```md\n# 假标题\n```\n\n    # 也是代码\n\n副标题\n---\n\n> ## 引用标题',
    );
    expect(headings.map((heading) => heading.text)).toEqual(['正文', '副标题', '引用标题']);
    expect(headings.map((heading) => heading.depth)).toEqual([1, 2, 2]);
    expect(headings[0].line).toBe(1);
  });
  it('重复标题、已有数字后缀、中文、空标题均有唯一锚点', () => {
    const headings = getHeadings('# A\n# A\n# A-1\n# A\n# 中文\n#\n#');
    expect(new Set(headings.map((heading) => heading.id)).size).toBe(headings.length);
    expect(headings.map((heading) => heading.id)).toContain('heading-中文');
  });
  it('目录文本不含内联 Markdown 标记，目录与预览使用相同 ID', () => {
    const content = '# **标题** 与 [链接](https://example.com)\n\n## 标题\n\n## 标题';
    const headings = getHeadings(content);
    const html = renderToStaticMarkup(
      createElement(MarkdownPreview, { value: content, headingPrefix: '' }),
    );
    expect(headings[0].text).toBe('标题 与 链接');
    for (const heading of headings) expect(html).toContain(`id="${heading.id}"`);
  });
});
