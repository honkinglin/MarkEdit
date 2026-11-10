import { messages } from '../i18n';
export interface Draft {
  version: 1;
  name: string;
  content: string;
}
export const DRAFT_KEY = 'markedit:draft:v1';
export const initialDraft: Draft = {
  version: 1,
  name: messages.welcomeFilename,
  content: messages.welcomeContent,
};
export function parseDraft(raw: string): Draft {
  const value: unknown = JSON.parse(raw);
  if (
    !value ||
    typeof value !== 'object' ||
    !('version' in value) ||
    value.version !== 1 ||
    !('name' in value) ||
    typeof value.name !== 'string' ||
    !('content' in value) ||
    typeof value.content !== 'string'
  ) {
    throw new Error(messages.invalidDraftFormat);
  }
  return { version: 1, name: value.name, content: value.content };
}
export function markdownFilename(name: string) {
  const clean = name.trim().replace(/[\\/:*?"<>|]/g, '-');
  return /\.(md|markdown)$/i.test(clean) ? clean : `${clean || messages.untitled}.md`;
}
