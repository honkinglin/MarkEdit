import { messages } from '../i18n';
import type { Heading } from '../lib/headings';
export function Outline({
  headings,
  onJump,
}: {
  headings: Heading[];
  onJump: (heading: Heading) => void;
}) {
  return (
    <nav className="outline" aria-label={messages.documentOutline}>
      <div className="pane-label">
        <span>{messages.documentOutline}</span>
        <span>{messages.headingCount(headings.length)}</span>
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
        {!headings.length && (
          <p className="empty-hint">{messages.addMarkdownHeadingsToSeeTheOutline}</p>
        )}
      </div>
    </nav>
  );
}
