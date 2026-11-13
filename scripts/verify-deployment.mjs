import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const base = new URL(process.argv[2] || 'https://minwoo19930301.github.io/resume/');
const expected = JSON.parse(await readFile(new URL('../release.json', import.meta.url), 'utf8'));
const fetchFile = async (filename, options = {}) => {
  const url = new URL(filename, base);
  url.searchParams.set('release', expected.release);
  return fetch(url, { ...options, signal: AbortSignal.timeout(30000) });
};
const manifestResponse = await fetchFile('release.json');
assert.equal(manifestResponse.status, 200, 'release manifest must load');
const live = await manifestResponse.json();
assert.deepEqual(live, expected, 'deployed release must match the built files');
for (const [filename, entry] of Object.entries(expected.files)) {
  const response = await fetchFile(filename);
  assert.equal(response.status, 200, `${filename} must load`);
  const bytes = Buffer.from(await response.arrayBuffer());
  assert.equal(bytes.length, entry.bytes, `${filename} length`);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), entry.sha256, `${filename} digest`);
  if (filename.endsWith('.mp4')) {
    assert.match(response.headers.get('content-type'), /video\/mp4/, `${filename} MIME type`);
    const range = await fetchFile(filename, { headers: { Range: 'bytes=0-1023' } });
    assert.equal(range.status, 206, `${filename} must support byte-range seeking`);
    assert.equal(range.headers.get('content-range'), `bytes 0-1023/${entry.bytes}`);
    assert.deepEqual(Buffer.from(await range.arrayBuffer()), bytes.subarray(0, 1024));
  }
}
console.log(`Verified release ${expected.release}: ${Object.keys(expected.files).length} assets and both video ranges at ${base}`);
