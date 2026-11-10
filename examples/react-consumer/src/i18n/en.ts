/** English UI copy. Keep complete sentences here so future locales can change word order. */
export const en = {
  controlledExample:
    '# Bring writing into your product\n\nThis is a **controlled editor**, with content managed by React state.\n\n- Keep editing and preview in sync\n- Write formulas like $E=mc^2$\n- Load diagrams and syntax highlighting on demand\n\n```typescript\nconst message: string = "Hello, MarkEdit";\n```',
  theSecondEditorManagesItsOwnContent: 'The second editor manages its own content.',
  anEditorThatFitsYourApplication: 'An editor that fits your application.',
  demoSubtitle: 'Controlled input, standalone preview, and composable editing tools.',
  componentSettings: 'Component settings',
  theme: 'Theme',
  light: 'Light',
  dark: 'Dark',
  view: 'View',
  split: 'Split',
  edit: 'Edit',
  preview: 'Preview',
  readOnlyMode: 'Read-only mode',
  resetContent: '# Reset by parent\n\nNew content comes from the value prop.',
  resetByParent: 'Reset by parent',
  insertedViaRef: '**Inserted via ref**',
  insertTextViaRef: 'Insert text via ref',
  section01ControlledEditor: '01 / Controlled editor',
  charactersValueOnChange: 'characters · value / onChange',
  controlledMarkdownSource: 'Controlled Markdown source',
  section02IndependentInstance: '02 / Independent instance',
  unmountInstance: 'Unmount instance',
  remountInstance: 'Remount instance',
  independentExample: '# Free writing\n\nThis instance does not affect the editor above.',
  independentMarkdownSource: 'Independent Markdown source',
  section03StandalonePreview: '03 / Standalone preview',
  diagramExample:
    '## From words to diagrams\n\n```mermaid\nflowchart LR\n A[Edit] --> B[Preview]\n B --> C[Publish]\n```',
  demoStorageNotice:
    'This example installs the local npm tarball. Documents stay in memory and reset on refresh.',
  instanceUpdated: (count: number) =>
    `Independent instance updated: ${count.toLocaleString('en')} ${count === 1 ? 'character' : 'characters'}`,
  controlledCount: (count: number) =>
    `${count.toLocaleString('en')} ${count === 1 ? 'character' : 'characters'} · value / onChange`,
};
