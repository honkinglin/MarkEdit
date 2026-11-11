import { messagesFor } from '../i18n';
import type { EditorLocale } from '../i18n';
import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { fencedCode, linkMarkdown, tableMarkdown } from '../lib/insertions';
export type InsertKind = 'link' | 'image' | 'table' | 'code';
export function InsertDialog({
  kind,
  portal = false,
  dark = false,
  selected,
  locale = 'en',
  onClose,
  onInsert,
}: {
  kind: InsertKind | null;
  portal?: boolean;
  dark?: boolean;
  selected: string;
  locale?: EditorLocale;
  onClose: () => void;
  onInsert: (text: string, block: boolean) => void;
}) {
  const messages = messagesFor(locale);
  const titles = {
    link: messages.insertLink,
    image: messages.insertImage,
    table: messages.insertTable,
    code: messages.insertCodeBlock,
  };
  const titleId = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  const [language, setLanguage] = useState('typescript');
  const [code, setCode] = useState('');
  const [rows, setRows] = useState(3);
  const [columns, setColumns] = useState(3);
  const [error, setError] = useState('');
  useEffect(() => {
    if (kind) {
      setLabel(selected);
      setCode(selected);
      setUrl('');
      setError('');
      dialog.current?.showModal();
    } else dialog.current?.close();
  }, [kind, selected]);
  const content = (
    <dialog
      ref={dialog}
      className="command-dialog insert-dialog"
      aria-labelledby={titleId}
      onCancel={onClose}
    >
      <div className="dialog-heading">
        <h2 id={titleId}>{kind ? titles[kind] : messages.insertContent}</h2>
        <button type="button" aria-label={messages.closeInsertPanel} onClick={onClose}>
          <X size={18} />
        </button>
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          try {
            if (!kind) return;
            const text =
              kind === 'table'
                ? tableMarkdown(rows, columns, locale)
                : kind === 'code'
                  ? fencedCode(code, language, locale)
                  : linkMarkdown(label, url, kind === 'image', locale);
            onInsert(text, kind === 'table' || kind === 'code' || kind === 'image');
            onClose();
          } catch (reason) {
            setError(reason instanceof Error ? reason.message : messages.couldNotInsertContent);
          }
        }}
      >
        {(kind === 'link' || kind === 'image') && (
          <>
            <label>
              {kind === 'image' ? messages.imageDescription : messages.linkText}
              <input
                aria-label={kind === 'image' ? messages.imageDescription : messages.linkText}
                value={label}
                onChange={(event) => setLabel(event.target.value)}
              />
            </label>
            <label>
              {kind === 'image' ? messages.imageURL : messages.linkURL}
              <input
                type="url"
                required
                placeholder="https://"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
              />
            </label>
            {kind === 'image' && <p className="empty-hint">{messages.imagePrivacyNotice}</p>}
          </>
        )}
        {kind === 'table' && (
          <div className="table-dimensions">
            <label>
              {messages.dataRows}{' '}
              <input
                type="number"
                required
                min="1"
                max="20"
                value={rows}
                onChange={(event) => setRows(Number(event.target.value))}
              />
            </label>
            <label>
              {messages.columns}{' '}
              <input
                type="number"
                required
                min="1"
                max="10"
                value={columns}
                onChange={(event) => setColumns(Number(event.target.value))}
              />
            </label>
          </div>
        )}
        {kind === 'code' && (
          <>
            <label>
              {messages.codeLanguage}{' '}
              <select value={language} onChange={(event) => setLanguage(event.target.value)}>
                {[
                  'typescript',
                  'javascript',
                  'tsx',
                  'jsx',
                  'python',
                  'json',
                  'html',
                  'css',
                  'bash',
                  'sql',
                  'markdown',
                  'mermaid',
                  'text',
                ].map((name) => (
                  <option key={name}>{name}</option>
                ))}
              </select>
            </label>
            <label>
              {messages.codeContent}{' '}
              <textarea rows={8} value={code} onChange={(event) => setCode(event.target.value)} />
            </label>
          </>
        )}
        {error && (
          <p className="render-error" role="alert">
            {error}
          </p>
        )}
        <div className="dialog-actions">
          <button type="button" onClick={onClose}>
            {messages.cancel}
          </button>
          <button className="export-button" type="submit">
            {messages.insert}
          </button>
        </div>
      </form>
    </dialog>
  );
  if (!portal) return content;
  return typeof document === 'undefined'
    ? null
    : createPortal(
        <div className="markedit" data-theme={dark ? 'dark' : 'light'}>
          {content}
        </div>,
        document.body,
      );
}
