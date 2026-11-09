import { StrictMode, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MarkdownEditor, MarkdownPreview } from '@markedit/react';
import type { EditorMode, EditorTheme, MarkdownEditorHandle } from '@markedit/react';
import '@markedit/react/style.css';
import './style.css';
const initial =
  '# 让写作融入你的产品\n\n这是一个 **受控编辑器**，正文由 React state 管理。\n\n- 编辑与预览同步\n- 支持公式 $E=mc^2$\n- 按需加载图表和代码高亮\n\n```typescript\nconst message: string = "Hello, MarkEdit";\n```';
function App() {
  const [value, setValue] = useState(initial);
  const [theme, setTheme] = useState<EditorTheme>('light');
  const [mode, setMode] = useState<EditorMode>('split');
  const [readOnly, setReadOnly] = useState(false);
  const [mounted, setMounted] = useState(true);
  const [message, setMessage] = useState('第二个实例独立维护自己的正文。');
  const editor = useRef<MarkdownEditorHandle>(null);
  return (
    <main className="demo">
      <header className="demo-header">
        <div>
          <span className="demo-eyebrow">MARKEDIT / REACT COMPONENTS</span>
          <h1>一个编辑器，融入你的应用。</h1>
          <p>受控输入、独立预览和可组合的编辑能力。</p>
        </div>
        <a href="https://github.com/pandao/editor.md">灵感来自 Editor.md ↗</a>
      </header>
      <section className="demo-controls" aria-label="组件配置">
        <label>
          主题{' '}
          <select
            aria-label="主题"
            value={theme}
            onChange={(e) => setTheme(e.target.value as EditorTheme)}
          >
            <option value="light">浅色</option>
            <option value="dark">深色</option>
          </select>
        </label>
        <label>
          视图{' '}
          <select
            aria-label="视图"
            value={mode}
            onChange={(e) => setMode(e.target.value as EditorMode)}
          >
            <option value="split">分屏</option>
            <option value="edit">编辑</option>
            <option value="preview">预览</option>
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            checked={readOnly}
            onChange={(e) => setReadOnly(e.target.checked)}
          />
          只读模式
        </label>
        <button onClick={() => setValue('# 父组件重置\n\n新的内容由 value prop 传入。')}>
          父组件重置
        </button>
        <button disabled={readOnly} onClick={() => editor.current?.insertText('**通过 ref 插入**')}>
          ref 插入文字
        </button>
      </section>
      <div className="demo-section-title">
        <h2>01 / 受控编辑器</h2>
        <span>{value.length} 字符 · value / onChange</span>
      </div>
      <MarkdownEditor
        ref={editor}
        value={value}
        onChange={setValue}
        theme={theme}
        mode={mode}
        readOnly={readOnly}
        height={420}
        ariaLabel="受控 Markdown 源码"
      />
      <div className="demo-grid">
        <section>
          <div className="demo-section-title">
            <h2>02 / 独立实例</h2>
            <button onClick={() => setMounted((v) => !v)}>
              {mounted ? '卸载实例' : '重新挂载'}
            </button>
          </div>
          {mounted && (
            <MarkdownEditor
              defaultValue={'# 自由记录\n\n这个实例不会影响上方的正文。'}
              onChange={(next) => setMessage(`独立实例已更新：${next.length} 字符`)}
              toolbar={['bold', 'italic', 'link', 'code']}
              mode="edit"
              theme={theme}
              height={260}
              ariaLabel="独立 Markdown 源码"
            />
          )}
          <p className="demo-note" role="status">
            {message}
          </p>
        </section>
        <section>
          <div className="demo-section-title">
            <h2>03 / 仅渲染预览</h2>
            <span>MarkdownPreview</span>
          </div>
          <div className="demo-preview">
            <MarkdownPreview
              theme={theme}
              value={
                '## 从文字到图形\n\n```mermaid\nflowchart LR\n A[编辑] --> B[预览]\n B --> C[发布]\n```'
              }
            />
          </div>
        </section>
      </div>
      <footer>本示例安装本地 npm tarball，不引用工作台源码。文档仅在内存中，刷新后重置。</footer>
    </main>
  );
}
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
