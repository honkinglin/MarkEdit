import { messages } from './i18n';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  BookOpen,
  Check,
  Columns2,
  Command as CommandIcon,
  Focus,
  History,
  ListTree,
  Moon,
  PanelLeftClose,
  PenLine,
  Plus,
  RotateCcw,
  Save,
  Sun,
  Trash2,
  X,
} from 'lucide-react';
import { MarkdownEditor } from './components/MarkdownEditor';
import type { MarkdownEditorHandle } from './components/MarkdownEditor';
import { MarkdownPreview } from './components/MarkdownPreview';
import { DocumentSidebar } from './components/DocumentSidebar';
import { CommandMenu } from './components/CommandMenu';
import type { Command } from './components/CommandMenu';
import { Outline } from './components/Outline';
import { usePreviewValue } from './hooks/usePreviewValue';
import { useScrollSync } from './hooks/useScrollSync';
import { useWorkspace } from './hooks/useWorkspace';
import { markdownFilename } from './lib/draft';
import { exportBackup } from './lib/documents';
import type { Heading } from './lib/headings';

type Mode = 'edit' | 'split' | 'preview';
function readPreferences(): { dark: boolean; ratio: number } {
  try {
    const value = JSON.parse(localStorage.getItem('markedit:preferences') ?? '{}');
    return {
      dark: value.dark === true,
      ratio:
        typeof value.ratio === 'number' && Number.isFinite(value.ratio)
          ? Math.max(30, Math.min(70, value.ratio))
          : 50,
    };
  } catch {
    return { dark: false, ratio: 50 };
  }
}
function downloadText(name: string, content: string, type = 'text/markdown;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export default function App() {
  const workspace = useWorkspace();
  const { active, documents, status, error, conflict, busy, ready } = workspace;
  const [preferences] = useState(readPreferences);
  const [dark, setDark] = useState(preferences.dark);
  const [ratio, setRatio] = useState(preferences.ratio);
  const [mode, setMode] = useState<Mode>('split');
  const [sidebar, setSidebar] = useState(() => window.matchMedia('(min-width: 801px)').matches);
  const [focus, setFocus] = useState(false);
  const [panel, setPanel] = useState<'outline' | 'history' | null>(() =>
    window.matchMedia('(min-width: 1201px)').matches ? 'outline' : null,
  );
  const [menu, setMenu] = useState(false);
  const [notice, setNotice] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  const backupInput = useRef<HTMLInputElement>(null);
  const editor = useRef<MarkdownEditorHandle>(null);
  const previewContainer = useRef<HTMLDivElement>(null);
  const [syncScroll, setSyncScroll] = useState(true);
  const preview = usePreviewValue(active?.content ?? '', active?.id);
  const { onEditorScroll, onPreviewScroll } = useScrollSync(
    editor,
    previewContainer,
    syncScroll && mode === 'split',
    preview,
    active?.id,
  );
  const [outline, setOutline] = useState<{
    content: string;
    headings: Heading[];
  }>({ content: '', headings: [] });
  const receiveHeadings = useCallback(
    (headings: Heading[]) => {
      setOutline({ content: preview, headings });
    },
    [preview],
  );
  const headings = outline.content === preview ? outline.headings : [];

  useEffect(() => {
    try {
      localStorage.setItem('markedit:preferences', JSON.stringify({ dark, ratio }));
    } catch {
      /* Preferences are optional; document storage has its own error handling. */
    }
  }, [dark, ratio]);
  const flush = workspace.flush;
  useEffect(() => {
    const shortcuts = (event: KeyboardEvent) => {
      if (event.isComposing) return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setMenu((open) => !open);
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        void flush()
          .then(() => setNotice(messages.documentSaved))
          .catch(() => undefined);
      }
      if (event.key === 'Escape') setFocus(false);
    };
    window.addEventListener('keydown', shortcuts);
    return () => window.removeEventListener('keydown', shortcuts);
  }, [flush]);

  async function run(promise: Promise<boolean>, message: string) {
    if (await promise) setNotice(message);
  }
  function create() {
    void run(workspace.create(), messages.documentCreated);
  }
  function download() {
    if (!active) return;
    downloadText(markdownFilename(active.name), active.content);
    setNotice(messages.markdownExported);
  }
  async function backup() {
    try {
      const records = await workspace.exportAll();
      downloadText(
        `markedit-backup-${new Date().toISOString().slice(0, 10)}.json`,
        exportBackup(records),
        'application/json;charset=utf-8',
      );
      setNotice(messages.backupComplete(records.length));
    } catch {
      /* The workspace displays persistence errors. */
    }
  }
  async function importFile(file: File | undefined, isBackup = false) {
    if (!file) return;
    if (!(isBackup ? /\.json$/i : /\.(md|markdown|txt)$/i).test(file.name)) {
      workspace.setError(
        isBackup ? messages.chooseAMarkEditJSONBackup : messages.chooseAMarkdownOrTextFile,
      );
      return;
    }
    if (file.size > (isBackup ? 20 : 1) * 1024 * 1024) {
      workspace.setError(
        isBackup ? messages.backupsMustBe20MBOrSmaller : messages.markdownFilesMustBe1MBOr,
      );
      return;
    }
    try {
      const content = await file.text();
      await run(
        isBackup ? workspace.importBackup(content) : workspace.create({ name: file.name, content }),
        isBackup ? messages.backupImported : messages.importedAsANewDocument,
      );
    } catch {
      workspace.setError(messages.fileReadFailed);
    }
  }
  function jump(heading: Heading) {
    if (mode !== 'preview') editor.current?.jumpToLine(heading.line);
    const target = previewContainer.current?.querySelector<HTMLElement>(`[id="${heading.id}"]`);
    target?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }
  const commands: Command[] = [
    {
      label: syncScroll ? messages.disableScrollSync : messages.enableScrollSync,
      run: () => setSyncScroll((value) => !value),
    },
    { label: messages.newDocument, run: create, disabled: !ready || busy },
    {
      label: messages.saveCurrentDocument,
      shortcut: '⌘/Ctrl S',
      run: () =>
        void flush()
          .then(() => setNotice(messages.documentSaved))
          .catch(() => undefined),
      disabled: !active || busy,
    },
    {
      label: messages.importMarkdownAsANewDocument,
      run: () => fileInput.current?.click(),
      disabled: !ready || busy,
    },
    { label: messages.exportCurrentMarkdown, run: download, disabled: !active },
    {
      label: messages.backUpAllDocumentsAndHistory,
      run: () => void backup(),
      disabled: !ready || busy,
    },
    {
      label: messages.importWorkspaceBackup,
      run: () => backupInput.current?.click(),
      disabled: !ready || busy,
    },
    {
      label: messages.saveVersionSnapshot,
      run: () => void run(workspace.checkpoint(), messages.versionSnapshotSaved),
      disabled: !active || busy,
    },
    { label: messages.viewVersionHistory, run: () => setPanel('history'), disabled: !active },
    { label: messages.viewDocumentOutline, run: () => setPanel('outline') },
    {
      label: focus ? messages.exitFocusMode : messages.enterFocusMode,
      shortcut: messages.escToExit,
      run: () => setFocus((value) => !value),
    },
    {
      label: dark ? messages.switchToLightTheme : messages.switchToDarkTheme,
      run: () => setDark((value) => !value),
    },
  ];
  return (
    <div className={`app ${dark ? 'dark' : ''} ${focus ? 'focus-mode' : ''}`}>
      {sidebar && !focus && (
        <DocumentSidebar
          documents={documents}
          active={active}
          busy={busy || !ready}
          onSelect={(id) => void run(workspace.switchDocument(id), messages.documentSwitched)}
          onCreate={create}
          onRestore={(doc) => void run(workspace.restore(doc), messages.documentRestored)}
          onClose={() => setSidebar(false)}
        />
      )}
      <main className="workspace">
        <header className="topbar">
          <div className="breadcrumbs">
            <button
              className="icon-button"
              aria-label={sidebar ? messages.collapseSidebar : messages.expandSidebar}
              onClick={() => setSidebar((value) => !value)}
            >
              <PanelLeftClose size={18} />
            </button>
            <span>{messages.myDocuments}</span>
            <span className="slash">/</span>
            <strong>{active?.name || messages.writingSpace}</strong>
          </div>
          <div className="header-actions">
            <button
              className="icon-button"
              title={messages.commandMenuCtrlK}
              aria-label={messages.openCommandMenu}
              onClick={() => setMenu(true)}
            >
              <CommandIcon size={18} />
            </button>
            <button
              className="icon-button"
              aria-label={dark ? messages.switchToLightTheme : messages.switchToDarkTheme}
              onClick={() => setDark(!dark)}
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              className="text-button"
              disabled={!ready || busy}
              onClick={() => fileInput.current?.click()}
            >
              <ArrowUpFromLine size={16} />
              {messages.import}
            </button>
            <button className="export-button" disabled={!active} onClick={download}>
              <ArrowDownToLine size={16} />
              {messages.exportMarkdown}
            </button>
          </div>
        </header>
        <input
          ref={fileInput}
          type="file"
          accept=".md,.markdown,.txt"
          hidden
          onChange={(event) => {
            void importFile(event.target.files?.[0]);
            event.target.value = '';
          }}
        />
        <input
          ref={backupInput}
          type="file"
          accept=".json"
          hidden
          onChange={(event) => {
            void importFile(event.target.files?.[0], true);
            event.target.value = '';
          }}
        />
        {error && (
          <div className="error-banner" role="alert">
            {error}
            <div className="error-actions">
              {conflict ? (
                <>
                  <button
                    disabled={busy}
                    onClick={() => {
                      if (window.confirm(messages.confirmReload))
                        void run(workspace.reloadRemote(), messages.latestVersionLoaded);
                    }}
                  >
                    {messages.loadLatestVersion}
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => void run(workspace.saveCopy(), messages.conflictCopySaved)}
                  >
                    {messages.saveACopy}
                  </button>
                </>
              ) : (
                <button disabled={busy} onClick={workspace.retry}>
                  {messages.retrySaveLoad}
                </button>
              )}
              {active && <button onClick={download}>{messages.exportCurrentContent}</button>}
            </div>
          </div>
        )}
        {active ? (
          <>
            <div className="document-heading">
              <div>
                <div className="eyebrow">YOUR SPACE TO THINK</div>
                <label className="title-label">
                  <input
                    aria-label={messages.documentName}
                    value={active.name}
                    disabled={busy}
                    onChange={(event) => workspace.edit({ name: event.target.value })}
                    maxLength={120}
                  />
                </label>
                <div className="save-label" role="status">
                  <span className={status === 'saved' ? 'status-dot' : 'status-dot pending'} />
                  {status === 'saved'
                    ? messages.allChangesSavedLocally
                    : status === 'saving'
                      ? messages.saving
                      : status === 'error'
                        ? messages.savingPaused
                        : messages.waitingToSave}
                  <span className="meta-separator">·</span> {messages.markdownDocument}
                </div>
              </div>
              <div className="document-controls">
                <button
                  className="icon-button"
                  aria-label={messages.moveToTrash}
                  title={messages.moveToTrashYouCanRestoreIt}
                  disabled={busy}
                  onClick={() => void run(workspace.remove(), messages.documentTrashed)}
                >
                  <Trash2 size={16} />
                </button>
                <button
                  className="icon-button"
                  aria-label={focus ? messages.exitFocusMode : messages.enterFocusMode}
                  aria-pressed={focus}
                  onClick={() => setFocus(!focus)}
                >
                  <Focus size={17} />
                </button>
                <button
                  className="icon-button"
                  aria-label={messages.documentOutline}
                  aria-pressed={panel === 'outline'}
                  onClick={() => setPanel(panel === 'outline' ? null : 'outline')}
                >
                  <ListTree size={17} />
                </button>
                <button
                  className="icon-button"
                  aria-label={messages.versionHistory}
                  aria-pressed={panel === 'history'}
                  onClick={() => setPanel(panel === 'history' ? null : 'history')}
                >
                  <History size={17} />
                </button>
                <div className="view-switch" role="group" aria-label={messages.editorView}>
                  {(
                    [
                      { id: 'edit', label: messages.edit, icon: PenLine },
                      { id: 'split', label: messages.split, icon: Columns2 },
                      { id: 'preview', label: messages.preview, icon: BookOpen },
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.id}
                      aria-pressed={mode === item.id}
                      onClick={() => setMode(item.id)}
                    >
                      <item.icon size={15} />
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="writing-area">
              <div
                className={`editor-shell mode-${mode}`}
                style={{ '--editor-width': `${ratio}%` } as CSSProperties}
              >
                <div className="editor-column" hidden={mode === 'preview'}>
                  <div className="pane-label">
                    <span>
                      <PenLine size={13} />
                      {messages.editor}
                    </span>
                    {mode === 'split' && (
                      <label className="split-control">
                        {messages.split}{' '}
                        <input
                          aria-label={messages.editorWidth}
                          type="range"
                          min="30"
                          max="70"
                          value={ratio}
                          onChange={(event) => setRatio(Number(event.target.value))}
                        />
                        <span>{ratio}%</span>
                      </label>
                    )}
                  </div>
                  <MarkdownEditor
                    key={active.id}
                    ref={editor}
                    onScrollLine={onEditorScroll}
                    value={active.content}
                    onChange={(content) => workspace.edit({ content })}
                    dark={dark}
                    disabled={busy}
                  />
                </div>
                <section
                  className="preview-column"
                  hidden={mode === 'edit'}
                  aria-label={messages.previewArea}
                >
                  <div className="pane-label">
                    <span>
                      <BookOpen size={13} />
                      {messages.livePreview}
                    </span>
                    <button
                      className="sync-toggle"
                      aria-pressed={syncScroll}
                      onClick={() => setSyncScroll((value) => !value)}
                      title={messages.syncScrollingBySourceLinePosition}
                    >
                      {messages.scrollSync} {syncScroll ? messages.on : messages.off}
                    </button>
                    <span className="live-label">
                      <span /> LIVE
                    </span>
                  </div>
                  <div className="preview-scroll" ref={previewContainer} onScroll={onPreviewScroll}>
                    <MarkdownPreview value={preview} onHeadings={receiveHeadings} />
                  </div>
                </section>
              </div>
              {!focus && panel && (
                <aside className="detail-panel">
                  <button
                    className="panel-close icon-button"
                    aria-label={messages.closeDetailsPanel}
                    onClick={() => setPanel(null)}
                  >
                    <X size={14} />
                  </button>
                  {panel === 'outline' ? (
                    <Outline headings={headings} onJump={jump} />
                  ) : (
                    <section className="history-panel" aria-label={messages.versionHistory}>
                      <div className="pane-label">
                        <span>{messages.versionHistory}</span>
                      </div>
                      <button
                        className="snapshot-button"
                        disabled={busy}
                        onClick={() =>
                          void run(workspace.checkpoint(), messages.versionSnapshotSaved)
                        }
                      >
                        <Save size={15} />
                        {messages.saveSnapshot}
                      </button>
                      <p className="empty-hint">{messages.snapshotPolicy}</p>
                      <div className="version-list">
                        {[...active.snapshots].reverse().map((snapshot) => (
                          <div className="version-entry" key={snapshot.id}>
                            <strong>{snapshot.name || messages.untitledMd}</strong>
                            <time>{new Date(snapshot.createdAt).toLocaleString('en')}</time>
                            <span>{messages.characterCount(snapshot.content.length)}</span>
                            <button
                              disabled={busy}
                              onClick={() =>
                                void run(
                                  workspace.restoreVersion(snapshot.id),
                                  messages.versionRestored,
                                )
                              }
                            >
                              <RotateCcw size={13} />
                              {messages.restoreThisVersion}
                            </button>
                          </div>
                        ))}
                        {!active.snapshots.length && (
                          <p className="empty-hint">{messages.noVersionsYet}</p>
                        )}
                      </div>
                    </section>
                  )}
                </aside>
              )}
            </div>
            <footer className="statusbar">
              <span>
                {messages.characterCount(Array.from(active.content.replace(/\s/g, '')).length)}{' '}
                <span className="meta-separator">·</span>
                {messages.lineCount(active.content.split('\n').length)}
              </span>
              <span className="keyboard-hint">{messages.ctrlKCommands}</span>
              <span>
                <Check size={13} /> UTF-8
              </span>
            </footer>
          </>
        ) : (
          <div className="empty-workspace">
            <BookOpen size={36} />
            <h1>
              {status === 'loading'
                ? messages.openingYourLibrary
                : messages.aBlankPageForYourNextIdea}
            </h1>
            <p>
              {status === 'loading'
                ? messages.loadingLocalDocumentsAndMigratingAnyPrevious
                : messages.createADocumentOrRestoreOneFrom}
            </p>
            <button className="export-button" disabled={!ready || busy} onClick={create}>
              <Plus size={16} />
              {messages.newDocument}
            </button>
          </div>
        )}
        <div className="workspace-notice" role="status" aria-live="polite">
          {notice}
        </div>
      </main>
      <CommandMenu open={menu} onClose={() => setMenu(false)} commands={commands} />
    </div>
  );
}
