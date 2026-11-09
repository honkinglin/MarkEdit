export interface ScrollPoint {
  line: number;
  top: number;
}
export function interpolate(value: number, points: ScrollPoint[], from: 'line' | 'top'): number {
  const to = from === 'line' ? 'top' : 'line';
  if (!points.length) return from === 'line' ? 0 : 1;
  if (value <= points[0][from]) return points[0][to];
  for (let index = 1; index < points.length; index++) {
    const a = points[index - 1],
      b = points[index];
    if (value <= b[from]) {
      const length = b[from] - a[from];
      return length <= 0 ? b[to] : a[to] + ((value - a[from]) / length) * (b[to] - a[to]);
    }
  }
  return points.at(-1)![to];
}
export function previewScrollPoints(container: HTMLElement, totalLines: number): ScrollPoint[] {
  const top = container.getBoundingClientRect().top;
  const byLine = new Map<number, number>([[1, 0]]);
  for (const element of container.querySelectorAll<HTMLElement>('[data-source-line]')) {
    const line = Number(element.dataset.sourceLine);
    if (!Number.isFinite(line)) continue;
    const y = Math.max(0, element.getBoundingClientRect().top - top + container.scrollTop);
    if (!byLine.has(line) || y < byLine.get(line)!) byLine.set(line, y);
  }
  const points = [...byLine].sort(([a], [b]) => a - b).map(([line, y]) => ({ line, top: y }));
  let last = 0;
  for (const point of points) {
    point.top = Math.max(last, point.top);
    last = point.top;
  }
  points.push({ line: totalLines + 1, top: Math.max(last, container.scrollHeight) });
  return points;
}
