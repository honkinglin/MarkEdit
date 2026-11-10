import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
export function verifyReleaseIntegrity(manifest, data, { commit, tag } = {}) {
  assert.equal(manifest.name, 'mark-edit');
  assert.match(manifest.version, /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/);
  assert.equal(manifest.filename, `mark-edit-${manifest.version}.tgz`);
  assert.equal(manifest.dirty, false, 'Publish a candidate prepared from a clean commit.');
  if (commit) assert.equal(manifest.commit, commit);
  if (tag) assert.equal(tag, `v${manifest.version}`);
  assert.equal(
    createHash('sha256').update(data).digest('hex'),
    manifest.sha256,
    'Artifact checksum differs from the verified candidate.',
  );
  assert.equal('sha512-' + createHash('sha512').update(data).digest('base64'), manifest.integrity);
}
