import { messages } from './i18n';
import { StrictMode, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MarkdownEditor, MarkdownPreview } from 'react-markedit';
import type { EditorMode, EditorTheme, MarkdownEditorHandle } from 'react-markedit';
import 'react-markedit/style.css';
import './style.css';
const initial = messages.controlledExample;
function App() {
  const [value, setValue] = useState(initial);
  const [theme, setTheme] = useState<EditorTheme>('light');
  const [mode, setMode] = useState<EditorMode>('split');
  const [readOnly, setReadOnly] = useState(false);
  const [mounted, setMounted] = useState(true);
  const [message, setMessage] = useState(messages.theSecondEditorManagesItsOwnContent);
  const editor = useRef<MarkdownEditorHandle>(null);
  return (
    <main className="demo">
      <header className="demo-header">
        <div>
          <span className="demo-eyebrow">MARKEDIT / REACT COMPONENTS</span>
          <h1>{messages.anEditorThatFitsYourApplication}</h1>
          <p>{messages.demoSubtitle}</p>
        </div>
      </header>
      <section className="demo-controls" aria-label={messages.componentSettings}>
        <label>
          {messages.theme}{' '}
          <select
            aria-label={messages.theme}
            value={theme}
            onChange={(e) => setTheme(e.target.value as EditorTheme)}
          >
            <option value="light">{messages.light}</option>
            <option value="dark">{messages.dark}</option>
          </select>
        </label>
        <label>
          {messages.view}{' '}
          <select
            aria-label={messages.view}
            value={mode}
            onChange={(e) => setMode(e.target.value as EditorMode)}
          >
            <option value="split">{messages.split}</option>
            <option value="edit">{messages.edit}</option>
            <option value="preview">{messages.preview}</option>
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            checked={readOnly}
            onChange={(e) => setReadOnly(e.target.checked)}
          />
          {messages.readOnlyMode}
        </label>
        <button onClick={() => setValue(messages.resetContent)}>{messages.resetByParent}</button>
        <button
          disabled={readOnly}
          onClick={() => editor.current?.insertText(messages.insertedViaRef)}
        >
          {messages.insertTextViaRef}
        </button>
      </section>
      <div className="demo-section-title">
        <h2>{messages.section01ControlledEditor}</h2>
        <span>{messages.controlledCount(value.length)}</span>
      </div>
      <MarkdownEditor
        ref={editor}
        value={value}
        onChange={setValue}
        theme={theme}
        mode={mode}
        readOnly={readOnly}
        height={420}
        ariaLabel={messages.controlledMarkdownSource}
      />
      <div className="demo-grid">
        <section>
          <div className="demo-section-title">
            <h2>{messages.section02IndependentInstance}</h2>
            <button onClick={() => setMounted((v) => !v)}>
              {mounted ? messages.unmountInstance : messages.remountInstance}
            </button>
          </div>
          {mounted && (
            <MarkdownEditor
              defaultValue={messages.independentExample}
              onChange={(next) => setMessage(messages.instanceUpdated(next.length))}
              toolbar={['bold', 'italic', 'link', 'code']}
              mode="edit"
              theme={theme}
              height={260}
              ariaLabel={messages.independentMarkdownSource}
            />
          )}
          <p className="demo-note" role="status">
            {message}
          </p>
        </section>
        <section>
          <div className="demo-section-title">
            <h2>{messages.section03StandalonePreview}</h2>
            <span>MarkdownPreview</span>
          </div>
          <div className="demo-preview">
            <MarkdownPreview theme={theme} value={messages.diagramExample} />
          </div>
        </section>
      </div>
      <footer>{messages.demoStorageNotice}</footer>
    </main>
  );
}
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
