// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useWorkspace } from './useWorkspace';
import { DocumentRepository, openRepository } from '../lib/documents';
import { DRAFT_KEY } from '../lib/draft';

let api: ReturnType<typeof useWorkspace>;
let root: ReturnType<typeof createRoot>;
let host: HTMLDivElement;
function Harness() {
  api = useWorkspace();
  return null;
}
async function mount() {
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
  await act(async () => {
    root.render(<Harness />);
  });
  await vi.waitFor(async () => {
    await act(async () => {});
    expect(api.ready, api.error).toBe(true);
  });
}
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  localStorage.clear();
  await new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase('markedit-workspace');
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
});
afterEach(async () => {
  await act(async () => root?.unmount());
  host?.remove();
  vi.restoreAllMocks();
});

describe('工作台保存与切换', () => {
  it('输入后立即新建仍保存原文，切换回来内容不串到新文档', async () => {
    await mount();
    const originalId = api.active!.id;
    await act(async () => {
      api.edit({ content: '尚未等待防抖的内容' });
      await api.create({ name: '第二份.md', content: '独立内容' });
    });
    expect(api.active?.content).toBe('独立内容');
    await act(async () => {
      await api.switchDocument(originalId);
    });
    expect(api.active?.content).toBe('尚未等待防抖的内容');
  });
  it('写入失败阻止切换，编辑内容保留，重试后成功', async () => {
    await mount();
    const originalId = api.active!.id;
    const fail = vi
      .spyOn(DocumentRepository.prototype, 'save')
      .mockRejectedValueOnce(new DOMException('存储满', 'QuotaExceededError'));
    await act(async () => {
      api.edit({ content: '不能丢失' });
      await api.create();
    });
    expect(api.active?.id).toBe(originalId);
    expect(api.active?.content).toBe('不能丢失');
    expect(api.status).toBe('error');
    fail.mockRestore();
    await act(async () => {
      await api.flush();
    });
    expect(api.status).toBe('saved');
    const repo = await openRepository();
    expect((await repo.get(originalId))?.content).toBe('不能丢失');
    repo.close();
  });
  it('保存事务期间的新输入不被旧保存结果覆盖', async () => {
    await mount();
    const original = DocumentRepository.prototype.save;
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    vi.spyOn(DocumentRepository.prototype, 'save').mockImplementationOnce(async function (
      this: DocumentRepository,
      doc,
    ) {
      await gate;
      return original.call(this, doc);
    });
    await act(async () => {
      api.edit({ content: '第一段' });
    });
    let saving!: Promise<void>;
    await act(async () => {
      saving = api.flush();
    });
    await act(async () => {
      api.edit({ content: '第一段与继续输入' });
      release();
      await saving;
    });
    expect(api.active?.content).toBe('第一段与继续输入');
    expect(api.status).toBe('pending');
    await act(async () => {
      await api.flush();
    });
    expect(api.status).toBe('saved');
  });
  it('冲突阻止覆盖，可把本页修改另存副本', async () => {
    await mount();
    const id = api.active!.id;
    const repo = await openRepository();
    const remote = (await repo.get(id))!;
    await repo.save({ ...remote, content: '其他标签页内容' });
    await act(async () => {
      api.edit({ content: '我的未保存内容' });
      await api.flush().catch(() => undefined);
    });
    expect(api.conflict).toBe(true);
    expect(api.active?.content).toBe('我的未保存内容');
    await act(async () => {
      await api.saveCopy();
    });
    expect(api.active?.id).not.toBe(id);
    expect(api.active?.content).toBe('我的未保存内容');
    expect((await repo.get(id))?.content).toBe('其他标签页内容');
    repo.close();
  });
  it('迁移后旧 localStorage 草稿仍保留为原始备份', async () => {
    const legacy = JSON.stringify({ version: 1, name: '旧稿.md', content: '迁移内容' });
    localStorage.setItem(DRAFT_KEY, legacy);
    await mount();
    expect(api.active?.content).toBe('迁移内容');
    expect(localStorage.getItem(DRAFT_KEY)).toBe(legacy);
  });
});
