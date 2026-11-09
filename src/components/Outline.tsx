import type { Heading } from '../lib/headings';
export function Outline({
  headings,
  onJump,
}: {
  headings: Heading[];
  onJump: (heading: Heading) => void;
}) {
  return (
    <nav className="outline" aria-label="文档目录">
      <div className="pane-label">
        <span>文档目录</span>
        <span>{headings.length} 个标题</span>
      </div>
      <div className="outline-list">
        {headings.map((heading) => (
          <button
            key={heading.id}
            title={heading.text}
            style={{ paddingLeft: 12 + (heading.depth - 1) * 12 }}
            onClick={() => onJump(heading)}
          >
            {heading.text}
          </button>
        ))}
        {!headings.length && <p className="empty-hint">添加 Markdown 标题后，目录会显示在这里。</p>}
      </div>
    </nav>
  );
}
