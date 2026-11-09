import { useCallback, useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import type { EditorInputHandle } from '../components/EditorInput';
import { interpolate, previewScrollPoints } from '../lib/scroll';
import type { ScrollPoint } from '../lib/scroll';

export function useScrollSync(
  editor: RefObject<Pick<EditorInputHandle, 'scrollToLine'> | null>,
  preview: RefObject<HTMLDivElement | null>,
  enabled: boolean,
  content: string,
  documentId?: string,
) {
  const lock = useRef<'editor' | 'preview' | null>(null);
  const release = useRef<ReturnType<typeof setTimeout> | null>(null);
  const frame = useRef<number | null>(null);
  const points = useRef<ScrollPoint[] | null>(null);
  const totalLines = useRef(1);
  totalLines.current = content.split('\n').length;
  useEffect(() => {
    points.current = null;
    const container = preview.current;
    if (!container || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => {
      points.current = null;
    });
    observer.observe(container);
    if (container.firstElementChild) observer.observe(container.firstElementChild);
    return () => observer.disconnect();
  }, [content, documentId, enabled, preview]);
  const getPoints = useCallback((container: HTMLElement) => {
    if (!points.current || typeof ResizeObserver === 'undefined')
      points.current = previewScrollPoints(container, totalLines.current);
    return points.current;
  }, []);
  const hold = useCallback((target: 'editor' | 'preview') => {
    lock.current = target;
    if (release.current) clearTimeout(release.current);
    release.current = setTimeout(() => {
      lock.current = null;
    }, 100);
  }, []);
  useEffect(() => {
    lock.current = null;
    return () => {
      if (release.current) clearTimeout(release.current);
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [enabled, documentId]);
  const onEditorScroll = useCallback(
    (line: number) => {
      if (!enabled || lock.current === 'editor' || !preview.current) return;
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        const container = preview.current;
        if (!container) return;
        hold('preview');
        container.scrollTop = interpolate(line, getPoints(container), 'line');
      });
    },
    [enabled, preview, hold, getPoints],
  );
  const onPreviewScroll = useCallback(() => {
    if (!enabled || lock.current === 'preview' || !preview.current) return;
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const container = preview.current;
      if (!container) return;
      hold('editor');
      if (
        container.scrollHeight > container.clientHeight &&
        container.scrollTop + container.clientHeight >= container.scrollHeight - 2
      ) {
        editor.current?.scrollToLine(totalLines.current + 1);
        return;
      }
      editor.current?.scrollToLine(interpolate(container.scrollTop, getPoints(container), 'top'));
    });
  }, [enabled, preview, editor, hold, getPoints]);
  return { onEditorScroll, onPreviewScroll };
}
