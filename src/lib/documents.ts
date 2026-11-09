import { initialDraft, parseDraft } from './draft';

export interface Snapshot {
  id: string;
  name: string;
  content: string;
  createdAt: number;
}
export interface DocumentRecord {
  id: string;
  name: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
  revision: number;
  snapshots: Snapshot[];
}
export type DocumentInput = Pick<DocumentRecord, 'name' | 'content'>;
export class ConflictError extends Error {
  constructor() {
    super('这份文档已在另一个标签页更新，请选择载入最新版本或另存副本。');
  }
}
export function newDocument(input: DocumentInput): DocumentRecord {
  const now = Date.now();
  return {
    ...input,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    revision: 1,
    snapshots: [],
  };
}
export function snapshotOf(doc: DocumentRecord): Snapshot {
  return { id: crypto.randomUUID(), name: doc.name, content: doc.content, createdAt: Date.now() };
}

function request<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
function completed(tx: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error ?? new Error('事务已取消'));
    tx.onerror = () => reject(tx.error ?? new Error('存储写入失败'));
  });
}
export async function openRepository(name = 'markedit-workspace'): Promise<DocumentRepository> {
  const req = indexedDB.open(name, 1);
  req.onupgradeneeded = () => {
    req.result.createObjectStore('documents', { keyPath: 'id' });
    req.result.createObjectStore('meta');
  };
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error('数据库升级被其他标签页阻塞，请关闭旧页面后重试。'));
  });
  db.onversionchange = () => db.close();
  return new DocumentRepository(db);
}
export class DocumentRepository {
  constructor(private db: IDBDatabase) {}
  close() {
    this.db.close();
  }

  // Read, compare revision, and write within one transaction: separate tabs cannot win the same revision.
  private async transact<T>(
    mode: IDBTransactionMode,
    run: (tx: IDBTransaction) => Promise<T>,
  ): Promise<T> {
    const tx = this.db.transaction(['documents', 'meta'], mode);
    const done = completed(tx);
    try {
      const result = await run(tx);
      await done;
      return result;
    } catch (error) {
      try {
        tx.abort();
      } catch {
        /* Already completed or aborted. */
      }
      await done.catch(() => undefined);
      throw error;
    }
  }
  async initialize(readLegacy: () => string | null) {
    return this.transact('readwrite', async (tx) => {
      const meta = tx.objectStore('meta');
      if (await request(meta.get('initialized'))) return;
      // Only consult localStorage on first initialization. Parsing failure leaves the database untouched.
      const raw = readLegacy();
      const draft = raw === null ? initialDraft : parseDraft(raw);
      await request(tx.objectStore('documents').add(newDocument(draft)));
      await request(meta.put(true, 'initialized'));
    });
  }
  async list(): Promise<DocumentRecord[]> {
    return this.transact('readonly', async (tx) => {
      const docs = await request<DocumentRecord[]>(tx.objectStore('documents').getAll());
      return docs.sort((a, b) => b.updatedAt - a.updatedAt || a.id.localeCompare(b.id));
    });
  }
  async get(id: string): Promise<DocumentRecord | undefined> {
    return this.transact('readonly', (tx) => request(tx.objectStore('documents').get(id)));
  }
  async create(input: DocumentInput) {
    const doc = newDocument(input);
    await this.transact('readwrite', async (tx) => {
      await request(tx.objectStore('documents').add(doc));
    });
    return doc;
  }
  async change(id: string, revision: number, update: (current: DocumentRecord) => DocumentRecord) {
    return this.transact('readwrite', async (tx) => {
      const store = tx.objectStore('documents');
      const current: DocumentRecord | undefined = await request(store.get(id));
      if (!current || current.revision !== revision) throw new ConflictError();
      const next = { ...update(current), id, revision: revision + 1, updatedAt: Date.now() };
      await request(store.put(next));
      return next;
    });
  }
  async save(doc: DocumentRecord) {
    return this.change(doc.id, doc.revision, (current) => {
      if (current.deletedAt !== null) throw new ConflictError();
      const last = current.snapshots.at(-1);
      const preserve = !last || Date.now() - last.createdAt >= 30_000;
      return {
        ...current,
        name: doc.name,
        content: doc.content,
        snapshots: preserve
          ? [...current.snapshots, snapshotOf(current)].slice(-30)
          : current.snapshots,
      };
    });
  }
  async checkpoint(doc: DocumentRecord) {
    return this.change(doc.id, doc.revision, (current) => ({
      ...current,
      snapshots: [...current.snapshots, snapshotOf(current)].slice(-30),
    }));
  }
  async restoreVersion(doc: DocumentRecord, snapshotId: string) {
    return this.change(doc.id, doc.revision, (current) => {
      if (current.deletedAt !== null) throw new ConflictError();
      const snapshot = current.snapshots.find((entry) => entry.id === snapshotId);
      if (!snapshot) throw new Error('该版本已不存在，请刷新版本列表。');
      return {
        ...current,
        name: snapshot.name,
        content: snapshot.content,
        snapshots: [...current.snapshots, snapshotOf(current)].slice(-30),
      };
    });
  }
  async setDeleted(doc: DocumentRecord, deleted: boolean) {
    return this.change(doc.id, doc.revision, (current) => ({
      ...current,
      deletedAt: deleted ? Date.now() : null,
    }));
  }
  async importBackup(raw: string) {
    const entries = parseBackup(raw);
    const imported = entries.map((entry) => ({ ...entry, id: crypto.randomUUID(), revision: 1 }));
    await this.transact('readwrite', async (tx) => {
      for (const doc of imported) await request(tx.objectStore('documents').add(doc));
    });
    return imported;
  }
}

export function exportBackup(documents: DocumentRecord[]) {
  return JSON.stringify(
    { format: 'markedit-backup', version: 1, exportedAt: new Date().toISOString(), documents },
    null,
    2,
  );
}
export function parseBackup(raw: string): DocumentRecord[] {
  const data: unknown = JSON.parse(raw);
  const object = (value: unknown): value is Record<string, unknown> =>
    !!value && typeof value === 'object';
  const time = (value: unknown): value is number =>
    typeof value === 'number' && Number.isFinite(value) && value >= 0;
  const text = (value: unknown): value is string => typeof value === 'string';
  if (
    !object(data) ||
    data.format !== 'markedit-backup' ||
    data.version !== 1 ||
    !Array.isArray(data.documents) ||
    data.documents.length > 1000
  )
    throw new Error('备份格式无效，或文档超过 1000 份。');
  return data.documents.map((entry: unknown) => {
    if (
      !object(entry) ||
      !text(entry.name) ||
      !text(entry.content) ||
      !time(entry.createdAt) ||
      !time(entry.updatedAt) ||
      !(entry.deletedAt === null || time(entry.deletedAt)) ||
      !Array.isArray(entry.snapshots) ||
      entry.snapshots.length > 30
    )
      throw new Error('备份中的文档数据无效，未导入任何文档。');
    const snapshots = entry.snapshots.map((snapshot: unknown): Snapshot => {
      if (
        !object(snapshot) ||
        !text(snapshot.name) ||
        !text(snapshot.content) ||
        !time(snapshot.createdAt)
      )
        throw new Error('备份中的版本数据无效。');
      return {
        id: crypto.randomUUID(),
        name: snapshot.name,
        content: snapshot.content,
        createdAt: snapshot.createdAt,
      };
    });
    return {
      id: crypto.randomUUID(),
      name: entry.name,
      content: entry.content,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      deletedAt: entry.deletedAt,
      revision: 1,
      snapshots,
    };
  });
}
