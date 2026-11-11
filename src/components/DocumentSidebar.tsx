import { messages } from '../i18n';
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
    <aside className="sidebar" aria-label={messages.documentLibrary}>
      <div className="brand">
        <span className="brand-mark">
          <Leaf size={22} />
        </span>
        MarkEdit<span className="brand-dot">.</span>
        <button
          className="mobile-close icon-button"
          aria-label={messages.closeDocumentLibrary}
          onClick={onClose}
        >
          <X size={18} />
        </button>
      </div>
      <div className="workspace-label">
        {messages.personalWorkspace} <span>{messages.local}</span>
      </div>
      <div className="library-tabs">
        <button aria-pressed={!trash} onClick={() => setTrash(false)}>
          <BookOpen size={15} />
          {messages.documents} {documents.filter((doc) => doc.deletedAt === null).length}
        </button>
        <button aria-pressed={trash} onClick={() => setTrash(true)}>
          <Trash2 size={15} />
          {messages.trash} {documents.filter((doc) => doc.deletedAt !== null).length}
        </button>
      </div>
      <label className="document-search">
        <Search size={14} />
        <input
          aria-label={messages.searchDocuments}
          placeholder={messages.searchTitlesOrContent}
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
        {messages.newDocument}
      </button>
      <div className="section-label">
        {trash ? messages.restoreAnytimeTrashIsNeverClearedAutomatically : messages.yourDocuments}
      </div>
      <div className="document-list">
        {visible.map((doc) => (
          <div className={`document-row ${doc.id === active?.id ? 'selected' : ''}`} key={doc.id}>
            {trash ? (
              <>
                <FileText size={16} />
                <span className="document-name">{doc.name || messages.untitledMd}</span>
                <button
                  title={messages.restoreDocument}
                  aria-label={messages.restoreNamedDocument(doc.name)}
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
                  {doc.id === active?.id
                    ? active.name || messages.untitledMd
                    : doc.name || messages.untitledMd}
                </span>
                {doc.id === active?.id && <span className="active-dot" />}
              </button>
            )}
          </div>
        ))}
        {visible.length === 0 && (
          <p className="empty-hint">
            {query
              ? messages.noMatchingDocuments
              : trash
                ? messages.trashIsEmpty
                : messages.createADocumentToStartWriting}
          </p>
        )}
      </div>
      <div className="local-badge">
        <span />
        {messages.savedInThisBrowserExportABackup}
      </div>
    </aside>
  );
}
