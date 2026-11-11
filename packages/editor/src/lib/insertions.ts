import { messagesFor } from '../i18n';
import type { EditorLocale } from '../i18n';
export function safeUrl(value: string, locale: EditorLocale = 'en'): string {
  const url = new URL(value.trim());
  if (!['https:', 'http:'].includes(url.protocol))
    throw new Error(messagesFor(locale).enterAnHttpOrHttpsURL);
  return url.href.replace(/\(/g, '%28').replace(/\)/g, '%29');
}
export function linkMarkdown(
  label: string,
  url: string,
  image = false,
  locale: EditorLocale = 'en',
) {
  const messages = messagesFor(locale);
  const text = (label || (image ? messages.imageDescription : messages.linkText))
    .replace(/([\\\[\]])/g, '\\$1')
    .replace(/\r?\n/g, ' ');
  return `${image ? '!' : ''}[${text}](${safeUrl(url, locale)})`;
}
export function tableMarkdown(rows: number, columns: number, locale: EditorLocale = 'en') {
  const messages = messagesFor(locale);
  if (
    !Number.isInteger(rows) ||
    rows < 1 ||
    rows > 20 ||
    !Number.isInteger(columns) ||
    columns < 1 ||
    columns > 10
  )
    throw new Error(messages.tablesMustHave120RowsAnd);
  const row = (cells: string[]) => `| ${cells.join(' | ')} |`;
  return [
    row(Array.from({ length: columns }, (_, i) => messages.tableHeading(i + 1))),
    row(Array(columns).fill('---')),
    ...Array.from({ length: rows }, () => row(Array(columns).fill(messages.content))),
  ].join('\n');
}
export function fencedCode(source: string, language: string, locale: EditorLocale = 'en') {
  const messages = messagesFor(locale);
  if (!/^[\w+-]*$/.test(language)) throw new Error(messages.invalidCodeLanguage);
  const longest = Math.max(2, ...(source.match(/`+/g) ?? []).map((run) => run.length));
  const fence = '`'.repeat(longest + 1);
  return `${fence}${language}\n${source}\n${fence}`;
}
export type UploadImage = (file: File) => Promise<string>;
export async function imageFromFile(file: File, upload: UploadImage, locale: EditorLocale = 'en') {
  const messages = messagesFor(locale);
  if (!['image/png', 'image/jpeg', 'image/gif', 'image/webp'].includes(file.type))
    throw new Error(messages.supportedImageFormats);
  if (file.size > 5 * 1024 * 1024) throw new Error(messages.imagesMustBe5MBOrSmaller);
  return linkMarkdown(file.name, await upload(file), true, locale);
}
