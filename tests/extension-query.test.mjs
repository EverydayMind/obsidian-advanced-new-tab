import assert from 'node:assert/strict';
import test from 'node:test';
import { loadTypeScript } from './load-typescript.mjs';

const { parseExtensionQuery } = await loadTypeScript('src/utils/extensionQuery.ts');
const known = new Set(['md', 'hwp', 'hwpx', 'pdf', 'canvas', 'png']);

test('leading-dot form', () => {
    assert.deepEqual(parseExtensionQuery('.hwp', known), { kind: 'dot', ext: 'hwp' });
    assert.deepEqual(parseExtensionQuery('  .HWPX ', known), { kind: 'dot', ext: 'hwpx' });
});
test('bare token form', () => {
    assert.deepEqual(parseExtensionQuery('hwpx', known), { kind: 'bare', ext: 'hwpx' });
    assert.deepEqual(parseExtensionQuery('Canvas', known), { kind: 'bare', ext: 'canvas' });
});
test('suffix form', () => {
    assert.deepEqual(parseExtensionQuery('점검 .hwpx', known), { kind: 'suffix', ext: 'hwpx', text: '점검' });
    assert.deepEqual(parseExtensionQuery('결과.hwpx', known), { kind: 'suffix', ext: 'hwpx', text: '결과' });
});
test('ordinary queries and unknown extensions are untouched', () => {
    for (const q of ['', ' ', 'meeting', '.xyz', 'a.xyz', 'version 1.25', 'x', '.p', '.', 'a b', '.hwp.bak', 'toolongext'])
        assert.deepEqual(parseExtensionQuery(q, known), { kind: 'none' }, q);
});
