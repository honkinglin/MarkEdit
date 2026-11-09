import { describe, expect, it } from 'vitest';
import { highlightCode } from './highlight';
describe('按语言代码高亮', () => {
  it('支持 TSX 别名，同时转义 HTML', async () => {
    const html = await highlightCode('const view = "<script>alert(1)</script>";', 'tsx');
    expect(html).toContain('hljs-keyword');
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('<script>');
  });
  it('未知语言与超长代码降级为纯文本', async () => {
    expect(await highlightCode('hello', 'unknown-language')).toBeNull();
    expect(await highlightCode('x'.repeat(100001), 'js')).toBeNull();
  });
});
