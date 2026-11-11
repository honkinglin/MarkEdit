import { en } from './en';
import { zh } from './zh';

export type Locale = 'en' | 'zh';
export const LOCALE_STORAGE_KEY = 'markedit:locale';
const catalogs: Record<Locale, typeof en> = { en, zh };

export let locale: Locale = 'en';

export function activateLocale(next: Locale) {
  locale = next;
}

export function getSavedLocale(): Locale {
  try {
    return localStorage.getItem(LOCALE_STORAGE_KEY) === 'zh' ? 'zh' : 'en';
  } catch {
    return 'en';
  }
}

export function persistLocale(next: Locale) {
  activateLocale(next);
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, next);
  } catch {
    // The language change still applies for this session when storage is unavailable.
  }
}

export const messages: typeof en = new Proxy(en, {
  get(_target, property, receiver) {
    return Reflect.get(catalogs[locale], property, receiver);
  },
});
