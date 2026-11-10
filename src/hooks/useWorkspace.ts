import { messages } from '../i18n';
import { useCallback, useEffect, useRef, useState } from 'react';
import { DRAFT_KEY } from '../lib/draft';
import { ConflictError, openRepository } from '../lib/documents';
import type { DocumentInput, DocumentRecord, DocumentRepository } from '../lib/documents';

export function useWorkspace() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [active, setActive] = useState<DocumentRecord | null>(null);
  const [status, setStatus] = useState<'loading' | 'saved' | 'pending' | 'saving' | 'error'>(
    'loading',
  );
  const [error, setError] = useState('');
  const [conflict, setConflict] = useState(false);
  const [busy, setBusy] = useState(false);
  const [epoch, setEpoch] = useState(0);
  const repository = useRef<DocumentRepository | null>(null);
  const current = useRef<DocumentRecord | null>(null);
  const dirty = useRef(false);
  const conflicted = useRef(false);
  const saving = useRef(false);
  const tail = useRef(Promise.resolve());
  const channel = useRef<BroadcastChannel | null>(null);
  const actionLock = useRef(false);

  const select = useCallback((doc: DocumentRecord | null) => {
    current.current = doc;
    dirty.current = false;
    conflicted.current = false;
    setConflict(false);
    setActive(doc);
    setStatus('saved');
  }, []);
  const refresh = useCallback(async () => {
    if (repository.current) setDocuments(await repository.current.list());
  }, []);
  const report = useCallback((reason: unknown) => {
    if (reason instanceof ConflictError) {
      conflicted.current = true;
      setConflict(true);
    }
    setStatus('error');
    setError(
      reason instanceof ConflictError
        ? reason.message
        : messages.operationFailed(reason instanceof Error ? reason.message : ''),
    );
  }, []);
  const notify = useCallback(() => {
    channel.current?.postMessage('changed');
  }, []);

  useEffect(() => {
    let disposed = false;
    let opened: DocumentRepository | null = null;
    setStatus('loading');
    void (async () => {
      try {
        opened = await openRepository();
        await opened.initialize(() => localStorage.getItem(DRAFT_KEY));
        const docs = await opened.list();
        if (disposed) {
          opened.close();
          return;
        }
        repository.current = opened;
        setDocuments(docs);
        select(docs.find((doc) => doc.deletedAt === null) ?? null);
        setError('');
      } catch (reason) {
        opened?.close();
        if (!disposed) report(reason);
      }
    })();
    return () => {
      disposed = true;
      opened?.close();
      repository.current = null;
    };
  }, [epoch, select, report]);

  const flush = useCallback(() => {
    const job = tail.current
      .then(async () => {
        if (conflicted.current) throw new ConflictError();
        const doc = current.current;
        const repo = repository.current;
        if (!repo) throw new Error(messages.theDocumentLibraryIsNotReady);
        if (!doc || !dirty.current) return;
        saving.current = true;
        setStatus('saving');
        try {
          const saved = await repo.save(doc);
          // Input may arrive while the transaction is pending. Carry its text forward with the new revision.
          if (current.current?.id === saved.id) {
            const changed =
              current.current.name !== doc.name || current.current.content !== doc.content;
            const next = { ...saved, name: current.current.name, content: current.current.content };
            current.current = next;
            dirty.current = changed;
            setActive(next);
            setStatus(changed ? 'pending' : 'saved');
          }
          setError('');
          await refresh();
          notify();
        } finally {
          saving.current = false;
        }
      })
      .catch((reason: unknown) => {
        report(reason);
        throw reason;
      });
    tail.current = job.catch(() => undefined);
    return job;
  }, [refresh, notify, report]);

  useEffect(() => {
    if (status !== 'pending' || busy) return;
    const timer = setTimeout(() => {
      void flush().catch(() => undefined);
    }, 350);
    return () => clearTimeout(timer);
  }, [active, status, busy, flush]);

  useEffect(() => {
    const guard = (event: BeforeUnloadEvent) => {
      if (dirty.current) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    const check = async () => {
      try {
        const repo = repository.current;
        if (!repo) return;
        await refresh();
        if (saving.current || actionLock.current) return;
        const doc = current.current;
        if (!doc) return;
        const remote = await repo.get(doc.id);
        // Recheck after await so fresh typing or a save cannot be overwritten.
        if (
          saving.current ||
          actionLock.current ||
          current.current?.id !== doc.id ||
          current.current.revision !== doc.revision
        )
          return;
        if (remote && remote.revision !== current.current.revision) {
          if (dirty.current) report(new ConflictError());
          else select(remote.deletedAt === null ? remote : null);
        }
      } catch (reason) {
        report(reason);
      }
    };
    const onFocus = () => {
      void check();
    };
    const onHidden = () => {
      if (document.visibilityState === 'hidden' && dirty.current)
        void flush().catch(() => undefined);
    };
    if (typeof BroadcastChannel !== 'undefined') {
      channel.current = new BroadcastChannel('markedit-workspace');
      channel.current.onmessage = onFocus;
    }
    window.addEventListener('focus', onFocus);
    window.addEventListener('beforeunload', guard);
    document.addEventListener('visibilitychange', onHidden);
    return () => {
      channel.current?.close();
      channel.current = null;
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('beforeunload', guard);
      document.removeEventListener('visibilitychange', onHidden);
    };
  }, [flush, refresh, report, select]);

  function edit(patch: Partial<DocumentInput>) {
    if (!current.current || actionLock.current) return;
    current.current = { ...current.current, ...patch };
    dirty.current = true;
    setActive(current.current);
    setStatus(conflicted.current ? 'error' : 'pending');
  }
  async function action(run: (repo: DocumentRepository) => Promise<void>, skipSave = false) {
    if (actionLock.current) return false;
    actionLock.current = true;
    setBusy(true);
    try {
      if (!skipSave) await flush();
      else await tail.current;
      if (!repository.current) throw new Error(messages.theDocumentLibraryIsNotReady);
      await run(repository.current);
      await refresh();
      notify();
      setError('');
      return true;
    } catch (reason) {
      report(reason);
      return false;
    } finally {
      actionLock.current = false;
      setBusy(false);
    }
  }
  return {
    documents,
    active,
    status,
    error,
    conflict,
    busy,
    ready: !!repository.current,
    edit,
    flush,
    setError,
    retry: () =>
      repository.current ? void flush().catch(() => undefined) : setEpoch((value) => value + 1),
    switchDocument: (id: string) =>
      action(async (repo) => {
        const doc = await repo.get(id);
        if (!doc || doc.deletedAt !== null) throw new Error(messages.thisDocumentIsInTheTrash);
        select(doc);
      }),
    create: (input: DocumentInput = { name: messages.untitledMd, content: '' }) =>
      action(async (repo) => {
        select(await repo.create(input));
      }),
    remove: () =>
      action(async (repo) => {
        if (!current.current) return;
        await repo.setDeleted(current.current, true);
        select((await repo.list()).find((doc) => doc.deletedAt === null) ?? null);
      }),
    restore: (doc: DocumentRecord) =>
      action(async (repo) => {
        select(await repo.setDeleted(doc, false));
      }),
    checkpoint: () =>
      action(async (repo) => {
        if (current.current) select(await repo.checkpoint(current.current));
      }),
    restoreVersion: (id: string) =>
      action(async (repo) => {
        if (current.current) select(await repo.restoreVersion(current.current, id));
      }),
    reloadRemote: () =>
      action(async (repo) => {
        const doc = current.current && (await repo.get(current.current.id));
        select(doc && doc.deletedAt === null ? doc : null);
      }, true),
    saveCopy: () =>
      action(async (repo) => {
        if (current.current)
          select(
            await repo.create({
              name: messages.conflictFilename(current.current.name.replace(/\.md$/i, '')),
              content: current.current.content,
            }),
          );
      }, true),
    importBackup: (raw: string) =>
      action(async (repo) => {
        const imported = await repo.importBackup(raw);
        const first = imported.find((doc) => doc.deletedAt === null);
        if (first) select(first);
      }),
    exportAll: async () => {
      await flush();
      return repository.current!.list();
    },
  };
}
