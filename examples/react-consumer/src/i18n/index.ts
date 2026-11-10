import { en } from './en';

/** English is the only supported locale. Browser language never changes this default. */
export const locale = 'en' as const;
export const messages = en;
