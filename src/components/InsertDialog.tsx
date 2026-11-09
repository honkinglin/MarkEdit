import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { fencedCode, linkMarkdown, tableMarkdown } from '../lib/insertions';
export type InsertKind = 'link' | 'image' | 'table' | 'code';
const titles = { link: '插入链接', image: '插入图片', table: '插入表格', code: '插入代码块' };
export function InsertDialog({
  kind,
  selected,
  onClose,
  onInsert,
}: {
  kind: InsertKind | null;
  selected: string;
  onClose: () => void;
  onInsert: (text: string, block: boolean) => void;
}) {
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
  return (
    <dialog
      ref={dialog}
      className="command-dialog insert-dialog"
      aria-labelledby="insert-title"
      onCancel={onClose}
    >
      <div className="dialog-heading">
        <h2 id="insert-title">{kind ? titles[kind] : '插入内容'}</h2>
        <button aria-label="关闭插入面板" onClick={onClose}>
          <X size={18} />
        </button>
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          try {
            if (!kind) return;
            const text =
              kind === 'table'
                ? tableMarkdown(rows, columns)
                : kind === 'code'
                  ? fencedCode(code, language)
                  : linkMarkdown(label, url, kind === 'image');
            onInsert(text, kind === 'table' || kind === 'code' || kind === 'image');
            onClose();
          } catch (reason) {
            setError(reason instanceof Error ? reason.message : '无法插入');
          }
        }}
      >
        {(kind === 'link' || kind === 'image') && (
          <>
            <label>
              {kind === 'image' ? '图片描述' : '链接文字'}
              <input
                aria-label={kind === 'image' ? '图片描述' : '链接文字'}
                value={label}
                onChange={(event) => setLabel(event.target.value)}
              />
            </label>
            <label>
              {kind === 'image' ? '图片地址' : '链接地址'}
              <input
                type="url"
                required
                placeholder="https://"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
              />
            </label>
            {kind === 'image' && (
              <p className="empty-hint">通过图片 URL 插入。查看预览时，浏览器会请求该图片地址。</p>
            )}
          </>
        )}
        {kind === 'table' && (
          <div className="table-dimensions">
            <label>
              数据行数
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
              列数
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
              代码语言
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
              代码内容
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
            取消
          </button>
          <button className="export-button" type="submit">
            插入
          </button>
        </div>
      </form>
    </dialog>
  );
}
