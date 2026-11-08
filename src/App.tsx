import { useDeferredValue, useEffect, useRef, useState } from 'react';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  BookOpen,
  Check,
  Columns2,
  FileText,
  Leaf,
  Moon,
  PanelLeftClose,
  PenLine,
  Sun,
} from 'lucide-react';
import { MarkdownEditor } from './components/MarkdownEditor';
import { MarkdownPreview } from './components/MarkdownPreview';
import { DRAFT_KEY, initialDraft, markdownFilename, parseDraft } from './lib/draft';
import type { Draft } from './lib/draft';

type Mode = 'edit' | 'split' | 'preview';
function loadDraft(): { draft: Draft; error: string } {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return { draft: raw === null ? initialDraft : parseDraft(raw), error: '' };
  } catch {
    return {
      draft: { version: 1, name: '恢复草稿.md', content: '' },
      error: '无法读取已有草稿，已暂停自动保存以保护原数据。你可以先导出当前内容，或重试读取。',
    };
  }
}
export default function App() {
  const [loaded] = useState(loadDraft);
  const [draft, setDraft] = useState(loaded.draft);
  const [blocked, setBlocked] = useState(!!loaded.error);
  const [error, setError] = useState(loaded.error);
  const [saved, setSaved] = useState(false);
  const [mode, setMode] = useState<Mode>('split');
  const [dark, setDark] = useState(false);
  const [sidebar, setSidebar] = useState(true);
  const upload = useRef<HTMLInputElement>(null);
  const latest = useRef(draft);
  latest.current = draft;
  const preview = useDeferredValue(draft.content);

  useEffect(() => {
    if (blocked) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      setSaved(true);
      setError('');
    } catch {
      setSaved(false);
      setError('本地保存失败，请导出 Markdown 备份。浏览器存储可能已满或不可用。');
    }
  }, [draft, blocked]);
  useEffect(() => {
    const guard = (event: BeforeUnloadEvent) => {
      if (!saved && draft.content) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', guard);
    return () => window.removeEventListener('beforeunload', guard);
  }, [saved, draft.content]);
  function update(patch: Partial<Draft>) {
    setSaved(false);
    setDraft((current) => ({ ...current, ...patch }));
  }
  function download() {
    const url = URL.createObjectURL(
      new Blob([draft.content], { type: 'text/markdown;charset=utf-8' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = markdownFilename(draft.name);
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function importFile(file?: File) {
    if (!file) return;
    if (!/\.(md|markdown|txt)$/i.test(file.name)) {
      setError('请选择 .md、.markdown 或 .txt 文件。');
      return;
    }
    if (file.size > 1024 * 1024) {
      setError('首版支持导入不超过 1 MB 的文本文件。');
      return;
    }
    try {
      const content = await file.text();
      if (
        latest.current.content &&
        !window.confirm('导入将替换当前草稿。需要保留的话，请先取消并导出当前文档。继续导入？')
      )
        return;
      update({ name: file.name, content });
    } catch {
      setError('文件读取失败，请重新选择文件。');
    }
  }
  function retryRead() {
    const result = loadDraft();
    if (result.error) {
      setError(result.error);
      return;
    }
    if (draft.content && !window.confirm('重试读取会用已存草稿替换当前内容，继续？')) return;
    setDraft(result.draft);
    setBlocked(false);
    setError('');
  }
  const characters = Array.from(draft.content.replace(/\s/g, '')).length;
  return (
    <div className={`app ${dark ? 'dark' : ''}`}>
      {sidebar && (
        <aside className="sidebar">
          <a className="brand" href="#">
            <span className="brand-mark">
              <Leaf size={22} />
            </span>
            MarkEdit<span className="brand-dot">.</span>
          </a>
          <div className="workspace-label">
            个人工作空间 <span>LOCAL</span>
          </div>
          <div className="nav-item">
            <BookOpen size={17} /> 我的草稿 <span>1</span>
          </div>
          <div className="section-label">正在写作</div>
          <div className="document-item">
            <FileText size={17} />
            <span>{draft.name || '未命名.md'}</span>
            <span className="active-dot" />
          </div>
          <div className="sidebar-note">
            <span className="note-line" />
            <p>
              每一个想法，
              <br />
              都值得一个开始。
            </p>
            <small>一点记录，一点生长。</small>
          </div>
          <div className="local-badge">
            <span /> 文件保存在此浏览器
          </div>
        </aside>
      )}
      <main className="workspace">
        <header className="topbar">
          <div className="breadcrumbs">
            <button
              className="icon-button"
              aria-label={sidebar ? '收起侧栏' : '展开侧栏'}
              onClick={() => setSidebar(!sidebar)}
            >
              <PanelLeftClose size={18} />
            </button>
            <span>我的草稿</span>
            <span className="slash">/</span>
            <strong>{draft.name || '未命名.md'}</strong>
          </div>
          <div className="header-actions">
            <button
              className="icon-button"
              aria-label={dark ? '切换浅色主题' : '切换深色主题'}
              onClick={() => setDark(!dark)}
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="text-button" onClick={() => upload.current?.click()}>
              <ArrowUpFromLine size={16} />
              导入
            </button>
            <button className="export-button" onClick={download}>
              <ArrowDownToLine size={16} />
              导出 Markdown
            </button>
            <input
              ref={upload}
              type="file"
              accept=".md,.markdown,.txt"
              hidden
              onChange={(event) => {
                void importFile(event.target.files?.[0]);
                event.target.value = '';
              }}
            />
          </div>
        </header>
        <div className="document-heading">
          <div>
            <div className="eyebrow">YOUR SPACE TO THINK</div>
            <label className="title-label">
              <input
                aria-label="文档名称"
                value={draft.name}
                onChange={(event) => update({ name: event.target.value })}
                maxLength={120}
              />
            </label>
            <div className="save-label" role="status">
              <span className={saved ? 'status-dot' : 'status-dot pending'} />
              {blocked ? '自动保存已暂停' : saved ? '所有更改已保存到本地' : '尚未保存'}
              <span className="meta-separator">·</span>Markdown 文档
            </div>
          </div>
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
        {error && (
          <div className="error-banner" role="alert">
            {error}
            {blocked && <button onClick={retryRead}>重试读取</button>}
          </div>
        )}
        <div className={`editor-shell mode-${mode}`}>
          <div className="editor-column" hidden={mode === 'preview'}>
            <div className="pane-label">
              <span>
                <PenLine size={13} />
                编辑器
              </span>
              <span>MARKDOWN</span>
            </div>
            <MarkdownEditor
              value={draft.content}
              onChange={(content) => update({ content })}
              dark={dark}
            />
          </div>
          <section className="preview-column" hidden={mode === 'edit'} aria-label="预览区域">
            <div className="pane-label">
              <span>
                <BookOpen size={13} />
                实时预览
              </span>
              <span className="live-label">
                <span /> LIVE
              </span>
            </div>
            <div className="preview-scroll">
              <MarkdownPreview value={preview} />
            </div>
          </section>
        </div>
        <footer className="statusbar">
          <span>
            {characters.toLocaleString()} 字符 <span className="meta-separator">·</span>{' '}
            {draft.content.split('\n').length} 行
          </span>
          <span className="keyboard-hint">
            ⌘ / Ctrl + F 搜索 <span className="meta-separator">·</span> ⌘ / Ctrl + Z 撤销
          </span>
          <span>
            <Check size={13} /> UTF-8
          </span>
        </footer>
      </main>
    </div>
  );
}
