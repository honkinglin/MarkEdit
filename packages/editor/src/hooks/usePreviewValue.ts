import { useDeferredValue, useEffect, useState } from 'react';

// Parsing is synchronous; deferral alone cannot interrupt one large Markdown parse.
// Coalesce long-document changes, while document switches never show another document's text.
export function usePreviewValue(value: string, documentId?: string) {
  const [snapshot, setSnapshot] = useState({ value, documentId });
  const large = value.length > 30_000;
  useEffect(() => {
    if (!large) return;
    const timer = setTimeout(() => setSnapshot({ value, documentId }), 180);
    return () => clearTimeout(timer);
  }, [value, documentId, large]);
  return useDeferredValue(large && snapshot.documentId === documentId ? snapshot.value : value);
}
