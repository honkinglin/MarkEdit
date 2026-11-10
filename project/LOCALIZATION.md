# Localization

English (`en`) is the default and the only supported UI locale. There is no language selector or browser-language detection yet.

## Catalog boundaries

- `src/i18n`: workspace labels, storage errors, notifications, welcome content, and count messages.
- `packages/editor/src/i18n`: reusable editor controls, insertion dialogs, validation errors, and preview feedback. This package never imports workspace translations.
- `examples/react-consumer/src/i18n`: independent consumer example content.
- Each `index.ts` exports the current locale and catalog; components import messages rather than embedding translated UI strings.
- Both HTML entry points declare `lang="en"`. Dates and numbers use explicit English formatting. Counts use complete messages with singular and plural forms.

User documents are data, not translation keys. Changing the interface must never rename saved documents, rewrite their content, or alter imported Markdown and backups. The English welcome document is only used when creating a new workspace; existing and migrated drafts are preserved.

## Adding a locale later

1. Define a message interface based on the English catalog, preserving function parameter types. Add a catalog with the same keys for each supported locale.
2. Add a locale provider at the appropriate application or editor-instance boundary. Avoid a mutable global locale, so embedded instances can remain independent.
3. Route date, number, plural, document language, and CodeMirror built-in phrases through that locale. English currently matches CodeMirror's default language.
4. Keep dynamic messages as complete sentences rather than joining translated fragments.
5. Test accessible labels, search, error states, layout, and persistence with the new locale. Keep multilingual document fixtures to verify content preservation.

The current catalogs intentionally do not add a runtime translation dependency or expose an unsupported language-switching API.
