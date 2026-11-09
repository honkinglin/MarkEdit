import { describe, expect, it } from 'vitest';
import { interpolate } from './scroll';
describe('源码行与预览位置映射', () => {
  const points = [
    { line: 1, top: 0 },
    { line: 10, top: 90 },
    { line: 20, top: 390 },
  ];
  it('按源码锚点插值，不用整篇滚动比例', () => {
    expect(interpolate(15, points, 'line')).toBe(240);
    expect(interpolate(240, points, 'top')).toBe(15);
    expect(interpolate(1, points, 'line')).toBe(0);
  });
  it('空文档、越界及重合坐标保持有限值', () => {
    expect(interpolate(-1, points, 'line')).toBe(0);
    expect(interpolate(999, points, 'top')).toBe(20);
    expect(interpolate(5, [], 'line')).toBe(0);
    expect(
      interpolate(
        0,
        [
          { line: 1, top: 0 },
          { line: 3, top: 0 },
        ],
        'top',
      ),
    ).toBe(1);
  });
});
