# Markdown，让表达更完整

## 数学公式

行内公式：$E = mc^2$。

$$
\int_0^1 x^2 \, dx = \frac{1}{3}
$$

## 流程图

```mermaid
flowchart LR
  A[记录想法] --> B[整理结构]
  B --> C[发布作品]
```

## 时序图

```mermaid
sequenceDiagram
  participant Writer as 写作者
  participant Editor as 编辑器
  Writer->>Editor: 输入 Markdown
  Editor-->>Writer: 实时预览
```

## 代码高亮

```typescript
interface Note {
  title: string;
}
const note: Note = { title: 'Hello, MarkEdit' };
```

## 表格

| 能力         | 状态 |
| ------------ | ---- |
| 数学公式     | 可用 |
| Mermaid 图表 | 可用 |
| 代码高亮     | 可用 |

## 图片

使用工具栏的图片面板输入 HTTP(S) 图片地址。组件使用者可以传入 `uploadImage(file)` 接入自己的上传服务。
