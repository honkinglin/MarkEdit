import { describe, expect, it, vi } from 'vitest';
import { fencedCode, imageFromFile, linkMarkdown, safeUrl, tableMarkdown } from './insertions';
describe('Markdown 输入与图片上传接口', () => {
  it('只允许 HTTP(S)，转义链接文字与括号 URL', () => {
    for (const url of ['javascript:alert(1)', 'data:image/svg+xml,xx', 'file:///etc/passwd'])
      expect(() => safeUrl(url)).toThrow();
    expect(linkMarkdown('文本[1]', 'https://example.com/a(b)')).toBe(
      '[文本\\[1\\]](https://example.com/a%28b%29)',
    );
  });
  it('表格大小受控，代码内容中的围栏不会截断代码块', () => {
    expect(tableMarkdown(2, 3).split('\n')).toHaveLength(4);
    expect(() => tableMarkdown(100, 1)).toThrow();
    expect(fencedCode('```nested```', 'markdown')).toBe('````markdown\n```nested```\n````');
    expect(() => fencedCode('x', 'js\nmalicious')).toThrow();
  });
  it('图片文件上传后使用校验过的 URL；失败不生成 Markdown', async () => {
    const file = new File(['test'], '图片.png', { type: 'image/png' });
    const upload = vi.fn().mockResolvedValue('https://example.com/image.png');
    expect(await imageFromFile(file, upload)).toBe('![图片.png](https://example.com/image.png)');
    expect(upload).toHaveBeenCalledWith(file);
    await expect(imageFromFile(file, async () => 'javascript:alert(1)')).rejects.toThrow();
    await expect(
      imageFromFile(file, async () => {
        throw new Error('网络失败');
      }),
    ).rejects.toThrow('网络失败');
  });
  it('SVG 和超大图片不会调用上传接口', async () => {
    const upload = vi.fn();
    await expect(
      imageFromFile(new File(['<svg/>'], 'x.svg', { type: 'image/svg+xml' }), upload),
    ).rejects.toThrow();
    await expect(
      imageFromFile(
        new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'x.png', { type: 'image/png' }),
        upload,
      ),
    ).rejects.toThrow();
    expect(upload).not.toHaveBeenCalled();
  });
});
