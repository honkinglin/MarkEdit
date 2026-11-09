import { describe, expect, it } from 'vitest';
import { renderFormula } from './math';
describe('KaTeX 公式', () => {
  it('行内与块级公式生成可访问的 MathML', () => {
    expect(renderFormula('E=mc^2', false)).toContain('<math');
    expect(renderFormula('\\frac{1}{3}', true)).toContain('katex-display');
  });
  it('错误和过长公式可被组件局部捕获', () => {
    expect(() => renderFormula('\\frac{', true)).toThrow();
    expect(() => renderFormula('x'.repeat(10001), false)).toThrow();
  });
  it('不允许不可信 URL 和 HTML 扩展', () => {
    const html = renderFormula('\\href{javascript:alert(1)}{click}', false);
    expect(html).not.toContain('href="javascript:');
    expect(() => renderFormula('\\htmlClass{evil}{x}', false)).toThrow();
  });
});
