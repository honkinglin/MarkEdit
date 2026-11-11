import { en } from './en';

import { zh } from './zh';

export type EditorLocale = 'en' | 'zh';
export const messages = en;
export function messagesFor(locale: EditorLocale = 'en') {
  return locale === 'zh' ? zh : en;
}
