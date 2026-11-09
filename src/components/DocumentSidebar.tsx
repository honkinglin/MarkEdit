import { useState } from 'react';
import { BookOpen, FileText, Leaf, Plus, RotateCcw, Search, Trash2, X } from 'lucide-react';
import type { DocumentRecord } from '../lib/documents';

interface Props {
  documents: DocumentRecord[];
  active: DocumentRecord | null;
  busy: boolean;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onRestore: (doc: DocumentRecord) => void;
  onClose: () => void;
}
export function DocumentSidebar({
  documents,
  active,
  busy,
  onSelect,
  onCreate,
  onRestore,
  onClose,
}: Props) {
  const [query, setQuery] = useState('');
  const [trash, setTrash] = useState(false);
  const visible = documents.filter(
    (doc) =>
      (doc.deletedAt !== null) === trash &&
      `${doc.name}\n${doc.content}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
  );
  return (
    <aside className="sidebar" aria-label="文档库">
      <div className="brand">
        <span className="brand-mark">
          <Leaf size={22} />
        </span>
        MarkEdit<span className="brand-dot">.</span>
        <button className="mobile-close icon-button" aria-label="关闭文档库" onClick={onClose}>
          <X size={18} />
        </button>
      </div>
      <div className="workspace-label">
        个人工作空间 <span>LOCAL</span>
      </div>
      <div className="library-tabs">
        <button aria-pressed={!trash} onClick={() => setTrash(false)}>
          <BookOpen size={15} />
          文档 {documents.filter((doc) => doc.deletedAt === null).length}
        </button>
        <button aria-pressed={trash} onClick={() => setTrash(true)}>
          <Trash2 size={15} />
          回收站 {documents.filter((doc) => doc.deletedAt !== null).length}
        </button>
      </div>
      <label className="document-search">
        <Search size={14} />
        <input
          aria-label="搜索文档"
          placeholder="搜索标题或正文…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      <button
        className="new-document"
        onClick={() => {
          setTrash(false);
          setQuery('');
          onCreate();
        }}
        disabled={busy}
      >
        <Plus size={16} />
        新建文档
      </button>
      <div className="section-label">{trash ? '可随时恢复，不会自动清空' : '你的文档'}</div>
      <div className="document-list">
        {visible.map((doc) => (
          <div className={`document-row ${doc.id === active?.id ? 'selected' : ''}`} key={doc.id}>
            {trash ? (
              <>
                <FileText size={16} />
                <span className="document-name">{doc.name || '未命名.md'}</span>
                <button
                  title="恢复文档"
                  aria-label={`恢复 ${doc.name}`}
                  disabled={busy}
                  onClick={() => {
                    onRestore(doc);
                    setTrash(false);
                  }}
                >
                  <RotateCcw size={15} />
                </button>
              </>
            ) : (
              <button
                className="document-item"
                disabled={busy}
                aria-current={doc.id === active?.id ? 'page' : undefined}
                onClick={() => onSelect(doc.id)}
              >
                <FileText size={16} />
                <span>
                  {doc.id === active?.id ? active.name || '未命名.md' : doc.name || '未命名.md'}
                </span>
                {doc.id === active?.id && <span className="active-dot" />}
              </button>
            )}
          </div>
        ))}
        {visible.length === 0 && (
          <p className="empty-hint">
            {query ? '没有匹配的文档' : trash ? '回收站是空的' : '新建一份文档，开始写作。'}
          </p>
        )}
      </div>
      <div className="local-badge">
        <span />
        保存在此浏览器 · 记得导出备份
      </div>
    </aside>
  );
}
