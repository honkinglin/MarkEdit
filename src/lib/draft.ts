import { messages } from '../i18n';
export interface Draft {
  version: 1;
  name: string;
  content: string;
}
export const legacyWelcomeDraft: Draft = {
  version: 1,
  name: '开始写作.md',
  content: `# 让想法，自由生长。

欢迎来到 **MarkEdit**，你的 Markdown 写作空间。

把注意力留给内容，其余的交给我们。从一篇笔记、一份文档，或一个尚未成形的想法开始。

## 一个安静的开始

在左侧写作，在右侧看见变化。支持你熟悉的 Markdown，也支持表格、任务列表和代码块。

> 写作不是把已有的想法写下来，而是在写作中发现想法。

## 今天，写点什么？

- [x] 找到一个舒服的写作空间
- [ ] 记录一个值得保留的想法
- [ ] 把灵感变成自己的作品

## 为开发者而生

\`\`\`tsx
function Hello() {
  return <h1>Hello, MarkEdit.</h1>;
}
\`\`\`

| 你的想法 | 适合的表达 |
| --- | --- |
| 梳理计划 | 任务列表 |
| 分享知识 | 技术笔记 |
| 开始创造 | 一份 README |

---

慢慢写，好想法值得被留下。
`,
};
export const DRAFT_KEY = 'markedit:draft:v1';
export const initialDraft: Draft = {
  version: 1,
  name: messages.welcomeFilename,
  content: messages.welcomeContent,
};
export function isLegacyWelcomeDraft(draft: Pick<Draft, 'name' | 'content'>) {
  return draft.name === legacyWelcomeDraft.name && draft.content === legacyWelcomeDraft.content;
}
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
