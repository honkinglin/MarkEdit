# Independent React consumer

From the repository root:

```bash
npm ci
npm run example:setup
npm run example:dev
```

`example:setup` builds and packs `react-markedit`, then installs the tarball here. This example is not an npm workspace. Every component import resolves to the installed package, with no source aliases. `.benchmarks` contains reproducible local artifacts and is not committed.

Run `npm run example:build` to check declarations and the production bundle. Once the tarball exists, `npm ci` can also run in this directory using its own lockfile.

The English interface demonstrates controlled input, parent resets, ref insertion, read-only mode, theme and view switching, unmounting and remounting an independent instance, and standalone preview. Content stays in memory and is not connected to workspace storage.
