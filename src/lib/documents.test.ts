import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ConflictError, exportBackup, openRepository } from './documents';
import type { DocumentRepository } from './documents';

const opened: DocumentRepository[] = [];
async function repository(name = crypto.randomUUID()) {
  const repo = await openRepository(name);
  opened.push(repo);
  return repo;
}
afterEach(() => {
  opened.forEach((repo) => repo.close());
  opened.length = 0;
  vi.restoreAllMocks();
});

describe('IndexedDB 文档仓库', () => {
  it('迁移旧草稿一次；空草稿保留；后续启动不再读取旧存储', async () => {
    const repo = await repository();
    const read = vi.fn(() => JSON.stringify({ version: 1, name: '旧草稿.md', content: '' }));
    await repo.initialize(read);
    await repo.initialize(() => {
      throw new Error('不应读取');
    });
    const docs = await repo.list();
    expect(read).toHaveBeenCalledTimes(1);
    expect(docs).toHaveLength(1);
    expect(docs[0]).toMatchObject({ name: '旧草稿.md', content: '' });
  });
  it('迁移失败不写入默认文档，可以修复后重试', async () => {
    const repo = await repository();
    await expect(repo.initialize(() => '{invalid')).rejects.toThrow();
    expect(await repo.list()).toEqual([]);
    await repo.initialize(() => JSON.stringify({ version: 1, name: '恢复.md', content: '中文' }));
    expect((await repo.list())[0].content).toBe('中文');
  });
  it('并发启动只迁移一份旧草稿', async () => {
    const name = crypto.randomUUID();
    const a = await repository(name);
    const b = await repository(name);
    await Promise.all([a.initialize(() => null), b.initialize(() => null)]);
    expect(await a.list()).toHaveLength(1);
  });
  it('不同文档独立保存；同文档过期版本不允许覆盖', async () => {
    const repo = await repository();
    const a = await repo.create({ name: 'A', content: 'A原文' });
    const b = await repo.create({ name: 'B', content: 'B原文' });
    await repo.save({ ...a, content: 'A修改' });
    await expect(repo.save({ ...a, content: '过期修改' })).rejects.toBeInstanceOf(ConflictError);
    expect((await repo.get(a.id))?.content).toBe('A修改');
    expect((await repo.get(b.id))?.content).toBe('B原文');
  });
  it('两个连接同时写同一版本时只有一个成功', async () => {
    const name = crypto.randomUUID();
    const a = await repository(name);
    const b = await repository(name);
    const doc = await a.create({ name: '竞争', content: '' });
    const results = await Promise.allSettled([
      a.save({ ...doc, content: 'A' }),
      b.save({ ...doc, content: 'B' }),
    ]);
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);
    expect((await a.get(doc.id))?.revision).toBe(2);
  });
  it('删除后正文与版本保留，过期编辑不会复活删除记录', async () => {
    const repo = await repository();
    const original = await repo.create({ name: '可恢复', content: '重要内容' });
    const doc = await repo.checkpoint(original);
    const deleted = await repo.setDeleted(doc, true);
    expect(deleted.deletedAt).not.toBeNull();
    await expect(repo.save({ ...doc, content: '旧标签页' })).rejects.toBeInstanceOf(ConflictError);
    const restored = await repo.setDeleted(deleted, false);
    expect(restored).toMatchObject({ deletedAt: null, content: '重要内容' });
    expect(restored.snapshots).toHaveLength(1);
  });
  it('恢复版本前保存当前内容，最多保留 30 个快照', async () => {
    const repo = await repository();
    let doc = await repo.create({ name: '历史', content: '第一版' });
    doc = await repo.checkpoint(doc);
    const oldId = doc.snapshots[0].id;
    doc = await repo.save({ ...doc, content: '第二版' });
    doc = await repo.restoreVersion(doc, oldId);
    expect(doc.content).toBe('第一版');
    expect(doc.snapshots.at(-1)?.content).toBe('第二版');
    for (let i = 0; i < 32; i++) doc = await repo.checkpoint(doc);
    expect(doc.snapshots).toHaveLength(30);
  });
  it('批量备份往返保留中文、回收站、历史，并以新 ID 导入', async () => {
    const repo = await repository();
    let doc = await repo.create({ name: '中文.md', content: '# 标题\n\n你好 🌱' });
    doc = await repo.checkpoint(doc);
    doc = await repo.setDeleted(doc, true);
    const [copy] = await repo.importBackup(exportBackup([doc]));
    expect(copy.id).not.toBe(doc.id);
    expect(copy.content).toBe(doc.content);
    expect(copy.deletedAt).toBe(doc.deletedAt);
    expect(copy.snapshots[0].content).toBe(doc.content);
    expect(await repo.list()).toHaveLength(2);
  });
  it('损坏批量备份不会部分导入', async () => {
    const repo = await repository();
    const doc = await repo.create({ name: '保留', content: '原文' });
    const backup = JSON.parse(exportBackup([doc]));
    backup.documents.push({ name: '坏文档' });
    await expect(repo.importBackup(JSON.stringify(backup))).rejects.toThrow();
    expect(await repo.list()).toHaveLength(1);
  });
  it('写入异常回滚事务，恢复存储后可使用同一版本重试', async () => {
    const repo = await repository();
    const doc = await repo.create({ name: '失败重试', content: '原文' });
    const spy = vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementationOnce(() => {
      throw new DOMException('配额耗尽', 'QuotaExceededError');
    });
    await expect(repo.save({ ...doc, content: '新内容' })).rejects.toThrow('配额耗尽');
    spy.mockRestore();
    expect((await repo.get(doc.id))?.content).toBe('原文');
    const saved = await repo.save({ ...doc, content: '新内容' });
    expect(saved.content).toBe('新内容');
    expect(saved.revision).toBe(2);
  });
});
