# Release guide

The React package is `react-markedit`; the first version is `0.1.0`. The private root workspace is never published. The package is MIT-licensed and associated with `honkinglin/MarkEdit`. The verified npm account for the first release is `kyrielin`.

## Prepare an exact candidate

```bash
npm ci
npx playwright install --with-deps chromium firefox webkit
npm run release:prepare
npm run release:report
```

`release:prepare` checks formatting, types, tests, production builds, the JS budget, the independent tarball consumer, and browser flows. `release:verify` inspects the tarball file list, metadata, licenses, entry points, and the consumer lockfile integrity, then writes `.benchmarks/release-manifest.json` and `SHA256SUMS`.

Commit the release source and rerun `npm run release:verify` so the manifest identifies a clean commit. Publishing uses the already-tested tarball with lifecycle scripts disabled. Do not rebuild a different artifact between verification and publishing.

```bash
node scripts/publish-artifact.mjs --dry-run
node scripts/publish-artifact.mjs
```

For the first publish, log in with `npm login` and complete any npm browser/2FA prompts yourself. Never put passwords, tokens, or authentication state in this repository. A registry 404 during a name lookup does not guarantee npm will accept the name.

## Future versions

```bash
npm version patch --workspace packages/editor --no-git-tag-version
```

Create `releases/<version>.md`, update CHANGELOG, and run `release:prepare`. The tarball and example dependency paths are derived from the package version, so scripts do not need a hardcoded filename change. Commit all source and lockfile updates, then tag that reviewed main-branch commit as `v<version>`.

## GitHub Actions publishing

`.github/workflows/release.yml` handles version tags:

1. Confirm tag/version agreement and that the commit is on `main`.
2. Run the complete candidate verification on a read-only job.
3. Upload that tarball, its manifest, and checksum.
4. Download the artifact in the `npm` environment, verify the checksum and commit, and publish via npm trusted publishing.
5. Create a GitHub Release with versioned notes and the matching artifact/checksum.

After the initial package exists, configure its npm **Trusted Publisher** with GitHub owner `honkinglin`, repository `MarkEdit`, workflow `release.yml`, environment `npm`, and permission to publish directly. Configure the GitHub `npm` environment as appropriate for your release process. This account-side setup is separate from committing the workflow and has not been inferred from a successful local login.

The workflow uses Node 24 and npm's OIDC flow without a long-lived npm token. See [npm trusted publishing documentation](https://docs.npmjs.com/trusted-publishers/) for runtime requirements and configuration. Re-running a release may reuse an already-published version only when its registry integrity exactly matches the candidate; a different artifact with the same version is rejected.

## Dependency review and validation limits

The direct formula renderer is KaTeX `^0.19.1`. The upstream math-parser dependency still declares an older transitive KaTeX. See the package README for the documented application-level override and advisory. Review the generated production license inventory; it is not a substitute for a license review.

Playwright WebKit is not the full Safari/device matrix. Real IME composition, OS clipboard permissions, storage quota exhaustion, crash recovery, and upload backends still need separate validation.

## Demo deployment

The workspace is deployed at <https://markedit-seven.vercel.app>. Vercel builds `main` from the repository root using `npm ci`, `npm run build`, and `dist`. The demo needs no server secrets or database. Document storage is origin-specific; changing domains requires exporting and importing documents to migrate them.
