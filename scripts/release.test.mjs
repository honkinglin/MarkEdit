import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { verifyReleaseIntegrity } from './release-integrity.mjs';
const data = Buffer.from('candidate tarball');
const manifest = {
  name: 'mark-edit',
  version: '0.1.0',
  filename: 'mark-edit-0.1.0.tgz',
  dirty: false,
  commit: 'abc',
  sha256: createHash('sha256').update(data).digest('hex'),
  integrity: 'sha512-' + createHash('sha512').update(data).digest('base64'),
};
test('accepts the tested artifact at the expected commit and version tag', () => {
  assert.doesNotThrow(() =>
    verifyReleaseIntegrity(manifest, data, { commit: 'abc', tag: 'v0.1.0' }),
  );
});
test('rejects artifact tampering', () => {
  assert.throws(() => verifyReleaseIntegrity(manifest, Buffer.from('different build')));
});
test('rejects an uncommitted source candidate', () => {
  assert.throws(() => verifyReleaseIntegrity({ ...manifest, dirty: true }, data));
});
test('rejects a mismatched release tag or source commit', () => {
  assert.throws(() => verifyReleaseIntegrity(manifest, data, { tag: 'v0.2.0' }));
  assert.throws(() => verifyReleaseIntegrity(manifest, data, { commit: 'def' }));
});
test('rejects a different package name or version-derived filename', () => {
  assert.throws(() => verifyReleaseIntegrity({ ...manifest, name: 'another-package' }, data));
  assert.throws(() => verifyReleaseIntegrity({ ...manifest, filename: '../candidate.tgz' }, data));
});
