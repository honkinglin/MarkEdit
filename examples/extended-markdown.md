# More ways to express your ideas

## Math

An inline formula: $E = mc^2$.

$$
\int_0^1 x^2 \, dx = \frac{1}{3}
$$

## Flowchart

```mermaid
flowchart LR
  A[Capture ideas] --> B[Organize thoughts]
  B --> C[Publish your work]
```

## Sequence diagram

```mermaid
sequenceDiagram
  participant Writer
  participant Editor
  Writer->>Editor: Write Markdown
  Editor-->>Writer: Show live preview
```

## Syntax highlighting

```typescript
interface Note {
  title: string;
}
const note: Note = { title: 'Hello, MarkEdit' };
```

## Tables

| Capability          | Status    |
| ------------------- | --------- |
| Math formulas       | Available |
| Mermaid diagrams    | Available |
| Syntax highlighting | Available |

## Images

Use the image dialog in the toolbar to enter an HTTP(S) image URL. Applications embedding the component can supply `uploadImage(file)` to connect their own upload service.
