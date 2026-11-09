export function safeUrl(value: string): string {
  const url = new URL(value.trim());
  if (!['https:', 'http:'].includes(url.protocol))
    throw new Error('请输入 http:// 或 https:// 地址');
  return url.href.replace(/\(/g, '%28').replace(/\)/g, '%29');
}
export function linkMarkdown(label: string, url: string, image = false) {
  const text = (label || (image ? '图片描述' : '链接文字'))
    .replace(/([\\\[\]])/g, '\\$1')
    .replace(/\r?\n/g, ' ');
  return `${image ? '!' : ''}[${text}](${safeUrl(url)})`;
}
export function tableMarkdown(rows: number, columns: number) {
  if (
    !Number.isInteger(rows) ||
    rows < 1 ||
    rows > 20 ||
    !Number.isInteger(columns) ||
    columns < 1 ||
    columns > 10
  )
    throw new Error('表格需为 1–20 行、1–10 列');
  const row = (cells: string[]) => `| ${cells.join(' | ')} |`;
  return [
    row(Array.from({ length: columns }, (_, i) => `标题 ${i + 1}`)),
    row(Array(columns).fill('---')),
    ...Array.from({ length: rows }, () => row(Array(columns).fill('内容'))),
  ].join('\n');
}
export function fencedCode(source: string, language: string) {
  if (!/^[\w+-]*$/.test(language)) throw new Error('代码语言只能包含字母、数字、下划线、+ 和 -');
  const longest = Math.max(2, ...(source.match(/`+/g) ?? []).map((run) => run.length));
  const fence = '`'.repeat(longest + 1);
  return `${fence}${language}\n${source}\n${fence}`;
}
export type UploadImage = (file: File) => Promise<string>;
export async function imageFromFile(file: File, upload: UploadImage) {
  if (!['image/png', 'image/jpeg', 'image/gif', 'image/webp'].includes(file.type))
    throw new Error('支持 PNG、JPEG、GIF 和 WebP 图片');
  if (file.size > 5 * 1024 * 1024) throw new Error('图片不能超过 5 MB');
  return linkMarkdown(file.name, await upload(file), true);
}
