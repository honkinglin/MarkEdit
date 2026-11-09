// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
const { initialize, render } = vi.hoisted(() => ({ initialize: vi.fn(), render: vi.fn() }));
vi.mock('mermaid', () => ({ default: { initialize, render } }));
import { renderDiagram } from './mermaid';
describe('Mermaid 渲染边界', () => {
  it('初始化严格模式与 SVG 文本标签', async () => {
    vi.resetModules();
    await import('./mermaid');
    expect(initialize).toHaveBeenCalledWith(
      expect.objectContaining({
        securityLevel: 'strict',
        htmlLabels: false,
        suppressErrorRendering: true,
      }),
    );
  });
  it('清理恶意 SVG，同时保留文本标签', async () => {
    render.mockResolvedValueOnce({
      svg: '<svg xmlns="http://www.w3.org/2000/svg"><text>安全标签</text><script>alert(1)</script><foreignObject><p>unsafe</p></foreignObject><image href="https://example.com" onload="alert(1)"/></svg>',
    });
    const svg = await renderDiagram('flowchart LR\nA-->B', () => false);
    expect(svg).toContain('安全标签');
    expect(svg).not.toMatch(/script|foreignObject|onload|href=/);
    expect(document.querySelector('.mermaid-render-host')).toBeNull();
  });
  it('失败后清理临时 DOM，后续图表仍能渲染', async () => {
    render
      .mockRejectedValueOnce(new Error('parse error'))
      .mockResolvedValueOnce({ svg: '<svg><text>下一张</text></svg>' });
    await expect(renderDiagram('invalid', () => false)).rejects.toThrow('parse error');
    expect(document.querySelector('.mermaid-render-host')).toBeNull();
    expect(await renderDiagram('flowchart LR\nA-->B', () => false)).toContain('下一张');
  });
  it('取消任务、超长输入和配置注入不会进入渲染器', async () => {
    render.mockClear();
    expect(await renderDiagram('flowchart LR', () => true)).toBe('');
    await expect(renderDiagram('x'.repeat(50001), () => false)).rejects.toThrow();
    await expect(
      renderDiagram('%%{init: {securityLevel: "loose"}}%%\nflowchart LR', () => false),
    ).rejects.toThrow();
    expect(render).not.toHaveBeenCalled();
  });
});
