import { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
export interface Command {
  label: string;
  shortcut?: string;
  run: () => void;
  disabled?: boolean;
}
export function CommandMenu({
  open,
  onClose,
  commands,
}: {
  open: boolean;
  onClose: () => void;
  commands: Command[];
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  useEffect(() => {
    if (open) {
      setQuery('');
      dialog.current?.showModal();
      search.current?.focus();
    } else dialog.current?.close();
  }, [open]);
  const matching = commands.filter((command) => command.label.includes(query.trim()));
  return (
    <dialog
      ref={dialog}
      className="command-dialog"
      aria-labelledby="command-title"
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="dialog-heading">
        <h2 id="command-title">命令与快捷键</h2>
        <button aria-label="关闭命令菜单" onClick={onClose}>
          <X size={18} />
        </button>
      </div>
      <label className="command-search">
        <Search size={17} />
        <input
          ref={search}
          autoFocus
          aria-label="搜索命令"
          placeholder="想做些什么？"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              const first = matching.find((command) => !command.disabled);
              if (first) {
                onClose();
                first.run();
              }
            }
          }}
        />
      </label>
      <div className="command-list">
        {matching.map((command) => (
          <button
            key={command.label}
            disabled={command.disabled}
            onClick={() => {
              onClose();
              command.run();
            }}
          >
            <span>{command.label}</span>
            {command.shortcut && <kbd>{command.shortcut}</kbd>}
          </button>
        ))}
        {matching.length === 0 && <p className="empty-hint">没有匹配的命令</p>}
      </div>
      <p className="shortcut-help">
        编辑器内：⌘/Ctrl + F 搜索 · ⌘/Ctrl + Z 撤销
        <br />
        ⌘/Ctrl + K 命令菜单 · ⌘/Ctrl + S 保存 · Esc 关闭菜单或退出专注
      </p>
    </dialog>
  );
}
