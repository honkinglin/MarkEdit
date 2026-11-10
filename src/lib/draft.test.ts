import { describe, expect, it } from 'vitest';
import { initialDraft, markdownFilename, parseDraft } from './draft';
describe('草稿数据恢复', () => {
  it('完整恢复中文、空内容和换行', () => {
    for (const content of ['', '# 中文\n\n- [ ] 写作 🌱']) {
      const draft = { ...initialDraft, content };
      expect(parseDraft(JSON.stringify(draft))).toEqual(draft);
    }
  });
  it('拒绝损坏数据与未知版本，避免用错误数据覆盖草稿', () => {
    for (const raw of [
      '{',
      'null',
      '{}',
      '{"version":2,"name":"x","content":"a"}',
      '{"version":1,"name":"x","content":10}',
    ]) {
      expect(() => parseDraft(raw)).toThrow();
    }
  });
});
describe('导出文件名', () => {
  it('保留 Markdown 扩展名并移除路径分隔符', () => {
    expect(markdownFilename('笔记.md')).toBe('笔记.md');
    expect(markdownFilename('../笔记')).toBe('..-笔记.md');
    expect(markdownFilename('')).toBe('Untitled.md');
  });
});
