import { afterEach, describe, expect, it, vi } from 'vitest';
import { getSavedLocale, locale, messages, persistLocale } from './index';
import { initialDraft, parseDraft } from '../lib/draft';

describe('English defaults', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('uses an English template without rewriting existing drafts', () => {
    expect(locale).toBe('en');
    expect(initialDraft.name).toBe('Getting started.md');
    expect(initialDraft.content).toContain('# Give your ideas room to grow.');
    const existing = { version: 1, name: '我的笔记.md', content: '# 中文\n\nKeep this 原文 🌱' };
    expect(parseDraft(JSON.stringify(existing))).toEqual(existing);
  });

  it('formats zero, singular, plural, and grouped counts in English', () => {
    expect(messages.characterCount(0)).toBe('0 characters');
    expect(messages.characterCount(1)).toBe('1 character');
    expect(messages.characterCount(1234)).toBe('1,234 characters');
    expect(messages.lineCount(1)).toBe('1 line');
    expect(messages.headingCount(2)).toBe('2 headings');
    expect(messages.backupComplete(1)).toContain('1 document,');
  });

  it('switches and remembers the selected interface language', () => {
    const values = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      clear: () => values.clear(),
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    });
    localStorage.clear();
    persistLocale('zh');
    expect(locale).toBe('zh');
    expect(getSavedLocale()).toBe('zh');
    expect(messages.newDocument).toBe('新建文档');
    expect(messages.welcomeContent).toContain('# Give your ideas room to grow.');

    persistLocale('en');
    expect(locale).toBe('en');
    expect(messages.newDocument).toBe('New document');
  });
});
