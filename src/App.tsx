import { useEffect, useMemo, useRef, useState } from 'react';
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
import { getHeadings } from './lib/headings';
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
  const headings = useMemo(() => getHeadings(preview), [preview]);

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
          .then(() => setNotice('已保存当前文档'))
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
    void run(workspace.create(), '已新建文档');
  }
  function download() {
    if (!active) return;
    downloadText(markdownFilename(active.name), active.content);
    setNotice('已导出当前 Markdown');
  }
  async function backup() {
    try {
      const records = await workspace.exportAll();
      downloadText(
        `markedit-backup-${new Date().toISOString().slice(0, 10)}.json`,
        exportBackup(records),
        'application/json;charset=utf-8',
      );
      setNotice(`已备份 ${records.length} 份文档（含回收站与版本）`);
    } catch {
      /* The workspace displays persistence errors. */
    }
  }
  async function importFile(file: File | undefined, isBackup = false) {
    if (!file) return;
    if (!(isBackup ? /\.json$/i : /\.(md|markdown|txt)$/i).test(file.name)) {
      workspace.setError(isBackup ? '请选择 MarkEdit JSON 备份。' : '请选择 Markdown 或文本文件。');
      return;
    }
    if (file.size > (isBackup ? 20 : 1) * 1024 * 1024) {
      workspace.setError(isBackup ? '备份不能超过 20 MB。' : 'Markdown 文件不能超过 1 MB。');
      return;
    }
    try {
      const content = await file.text();
      await run(
        isBackup ? workspace.importBackup(content) : workspace.create({ name: file.name, content }),
        isBackup ? '已将备份导入为独立副本，现有文档未被覆盖' : '已导入为新文档',
      );
    } catch {
      workspace.setError('文件读取失败，请重新选择。');
    }
  }
  function jump(heading: Heading) {
    if (mode !== 'preview') editor.current?.jumpToLine(heading.line);
    const target = previewContainer.current?.querySelector<HTMLElement>(`[id="${heading.id}"]`);
    target?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }
  const commands: Command[] = [
    {
      label: syncScroll ? '关闭同步滚动' : '开启同步滚动',
      run: () => setSyncScroll((value) => !value),
    },
    { label: '新建文档', run: create, disabled: !ready || busy },
    {
      label: '保存当前文档',
      shortcut: '⌘/Ctrl S',
      run: () =>
        void flush()
          .then(() => setNotice('已保存当前文档'))
          .catch(() => undefined),
      disabled: !active || busy,
    },
    {
      label: '导入 Markdown 为新文档',
      run: () => fileInput.current?.click(),
      disabled: !ready || busy,
    },
    { label: '导出当前 Markdown', run: download, disabled: !active },
    { label: '备份全部文档与历史', run: () => void backup(), disabled: !ready || busy },
    { label: '导入工作台备份', run: () => backupInput.current?.click(), disabled: !ready || busy },
    {
      label: '保存版本快照',
      run: () => void run(workspace.checkpoint(), '已保存版本快照'),
      disabled: !active || busy,
    },
    { label: '查看版本历史', run: () => setPanel('history'), disabled: !active },
    { label: '查看文档目录', run: () => setPanel('outline') },
    {
      label: focus ? '退出专注模式' : '进入专注模式',
      shortcut: 'Esc 退出',
      run: () => setFocus((value) => !value),
    },
    { label: dark ? '切换浅色主题' : '切换深色主题', run: () => setDark((value) => !value) },
  ];
  return (
    <div className={`app ${dark ? 'dark' : ''} ${focus ? 'focus-mode' : ''}`}>
      {sidebar && !focus && (
        <DocumentSidebar
          documents={documents}
          active={active}
          busy={busy || !ready}
          onSelect={(id) => void run(workspace.switchDocument(id), '已切换文档')}
          onCreate={create}
          onRestore={(doc) => void run(workspace.restore(doc), '已恢复文档')}
          onClose={() => setSidebar(false)}
        />
      )}
      <main className="workspace">
        <header className="topbar">
          <div className="breadcrumbs">
            <button
              className="icon-button"
              aria-label={sidebar ? '收起侧栏' : '展开侧栏'}
              onClick={() => setSidebar((value) => !value)}
            >
              <PanelLeftClose size={18} />
            </button>
            <span>我的文档</span>
            <span className="slash">/</span>
            <strong>{active?.name || '写作空间'}</strong>
          </div>
          <div className="header-actions">
            <button
              className="icon-button"
              title="命令菜单 · ⌘/Ctrl K"
              aria-label="打开命令菜单"
              onClick={() => setMenu(true)}
            >
              <CommandIcon size={18} />
            </button>
            <button
              className="icon-button"
              aria-label={dark ? '切换浅色主题' : '切换深色主题'}
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
              导入
            </button>
            <button className="export-button" disabled={!active} onClick={download}>
              <ArrowDownToLine size={16} />
              导出 Markdown
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
                      if (
                        window.confirm(
                          '载入最新版本会丢弃本页未保存修改。你也可以取消后选择另存副本。继续？',
                        )
                      )
                        void run(workspace.reloadRemote(), '已载入最新版本');
                    }}
                  >
                    载入最新版本
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => void run(workspace.saveCopy(), '已另存冲突副本')}
                  >
                    另存副本
                  </button>
                </>
              ) : (
                <button disabled={busy} onClick={workspace.retry}>
                  重试保存 / 加载
                </button>
              )}
              {active && <button onClick={download}>导出当前内容</button>}
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
                    aria-label="文档名称"
                    value={active.name}
                    disabled={busy}
                    onChange={(event) => workspace.edit({ name: event.target.value })}
                    maxLength={120}
                  />
                </label>
                <div className="save-label" role="status">
                  <span className={status === 'saved' ? 'status-dot' : 'status-dot pending'} />
                  {status === 'saved'
                    ? '所有更改已保存到本地'
                    : status === 'saving'
                      ? '正在保存…'
                      : status === 'error'
                        ? '保存已暂停'
                        : '等待保存…'}
                  <span className="meta-separator">·</span>Markdown 文档
                </div>
              </div>
              <div className="document-controls">
                <button
                  className="icon-button"
                  aria-label="移入回收站"
                  title="移入回收站，可恢复"
                  disabled={busy}
                  onClick={() => void run(workspace.remove(), '已移入回收站，可在侧栏恢复')}
                >
                  <Trash2 size={16} />
                </button>
                <button
                  className="icon-button"
                  aria-label={focus ? '退出专注模式' : '进入专注模式'}
                  aria-pressed={focus}
                  onClick={() => setFocus(!focus)}
                >
                  <Focus size={17} />
                </button>
                <button
                  className="icon-button"
                  aria-label="文档目录"
                  aria-pressed={panel === 'outline'}
                  onClick={() => setPanel(panel === 'outline' ? null : 'outline')}
                >
                  <ListTree size={17} />
                </button>
                <button
                  className="icon-button"
                  aria-label="版本历史"
                  aria-pressed={panel === 'history'}
                  onClick={() => setPanel(panel === 'history' ? null : 'history')}
                >
                  <History size={17} />
                </button>
                <div className="view-switch" role="group" aria-label="编辑视图">
                  {(
                    [
                      { id: 'edit', label: '编辑', icon: PenLine },
                      { id: 'split', label: '分屏', icon: Columns2 },
                      { id: 'preview', label: '预览', icon: BookOpen },
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
                      编辑器
                    </span>
                    {mode === 'split' && (
                      <label className="split-control">
                        分屏{' '}
                        <input
                          aria-label="编辑器宽度"
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
                <section className="preview-column" hidden={mode === 'edit'} aria-label="预览区域">
                  <div className="pane-label">
                    <span>
                      <BookOpen size={13} />
                      实时预览
                    </span>
                    <button
                      className="sync-toggle"
                      aria-pressed={syncScroll}
                      onClick={() => setSyncScroll((value) => !value)}
                      title="基于源码行位置同步滚动"
                    >
                      同步滚动 {syncScroll ? '开' : '关'}
                    </button>
                    <span className="live-label">
                      <span /> LIVE
                    </span>
                  </div>
                  <div className="preview-scroll" ref={previewContainer} onScroll={onPreviewScroll}>
                    <MarkdownPreview value={preview} />
                  </div>
                </section>
              </div>
              {!focus && panel && (
                <aside className="detail-panel">
                  <button
                    className="panel-close icon-button"
                    aria-label="关闭详情面板"
                    onClick={() => setPanel(null)}
                  >
                    <X size={14} />
                  </button>
                  {panel === 'outline' ? (
                    <Outline headings={headings} onJump={jump} />
                  ) : (
                    <section className="history-panel" aria-label="版本历史">
                      <div className="pane-label">
                        <span>版本历史</span>
                      </div>
                      <button
                        className="snapshot-button"
                        disabled={busy}
                        onClick={() => void run(workspace.checkpoint(), '已保存版本快照')}
                      >
                        <Save size={15} />
                        保存快照
                      </button>
                      <p className="empty-hint">
                        自动版本间隔至少 30 秒，保留最近 30 份。恢复前会保存当前版本。
                      </p>
                      <div className="version-list">
                        {[...active.snapshots].reverse().map((snapshot) => (
                          <div className="version-entry" key={snapshot.id}>
                            <strong>{snapshot.name || '未命名.md'}</strong>
                            <time>{new Date(snapshot.createdAt).toLocaleString('zh-CN')}</time>
                            <span>{snapshot.content.length} 字符</span>
                            <button
                              disabled={busy}
                              onClick={() =>
                                void run(
                                  workspace.restoreVersion(snapshot.id),
                                  '已恢复所选版本，恢复前的内容也已保留',
                                )
                              }
                            >
                              <RotateCcw size={13} />
                              恢复此版本
                            </button>
                          </div>
                        ))}
                        {!active.snapshots.length && <p className="empty-hint">还没有历史版本。</p>}
                      </div>
                    </section>
                  )}
                </aside>
              )}
            </div>
            <footer className="statusbar">
              <span>
                {Array.from(active.content.replace(/\s/g, '')).length.toLocaleString()} 字符
                <span className="meta-separator">·</span>
                {active.content.split('\n').length} 行
              </span>
              <span className="keyboard-hint">⌘ / Ctrl + K 命令菜单</span>
              <span>
                <Check size={13} /> UTF-8
              </span>
            </footer>
          </>
        ) : (
          <div className="empty-workspace">
            <BookOpen size={36} />
            <h1>{status === 'loading' ? '正在打开文档库…' : '给下一个想法，一张白纸。'}</h1>
            <p>
              {status === 'loading'
                ? '正在读取本地文档，首次使用会迁移旧草稿。'
                : '新建文档，或者从回收站找回之前的记录。'}
            </p>
            <button className="export-button" disabled={!ready || busy} onClick={create}>
              <Plus size={16} />
              新建文档
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
