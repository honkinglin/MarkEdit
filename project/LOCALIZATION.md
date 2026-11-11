# Localization

The workspace and reusable React editor support English (`en`) and Simplified Chinese (`zh`). English remains the default. The workspace provides a language button in the top bar; browser language is not used to select the interface language.

## Catalog boundaries

- `src/i18n`: workspace labels, storage errors, notifications, welcome content, and count messages. The selected locale is stored under `markedit:locale`.
- `packages/editor/src/i18n`: reusable editor controls, insertion dialogs, validation errors, preview feedback, and CodeMirror search-panel phrases. Components receive locale per instance and do not import workspace translations.
- `examples/react-consumer/src/i18n`: independent consumer example content.
- The workspace resolves messages from the active locale; library components use the `locale` prop. UI strings belong in typed catalogs rather than inline component text.
- The workspace updates the root HTML `lang` attribute and formats dates and counts for the selected locale. The independent consumer example remains English by default.

User documents are data, not translation keys. Changing the interface must never rename saved documents, rewrite their content, or alter imported Markdown and backups. The English welcome document is only used when creating a new workspace; existing and migrated drafts are preserved.

## Adding a locale

1. Define a message interface based on the English catalog, preserving function parameter types. Add a catalog with the same keys for each supported locale.
2. Add the locale at the correct application or editor-instance boundary. Keep reusable editor instances independent.
3. Route date, number, plural, document language, and CodeMirror built-in phrases through that locale.
4. Keep dynamic messages as complete sentences rather than joining translated fragments.
5. Test accessible labels, search, error states, layout, and persistence with the new locale. Keep multilingual document fixtures to verify content preservation.

The catalogs are maintained locally without a runtime translation dependency. User documents and imported Markdown are data, not translation keys, and are never rewritten when the interface language changes.
