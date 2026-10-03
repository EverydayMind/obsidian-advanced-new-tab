import test from 'node:test';
import assert from 'node:assert/strict';
import { validateRelease } from '../scripts/check-release.mjs';

const metadata = () => ({
    manifest: { id: 'advanced-new-tab', version: '1.0.0', minAppVersion: '1.13.0', description: 'Search your vault.', author: 'everydaymind', isDesktopOnly: false },
    pkg: { name: 'advanced-new-tab', version: '1.0.0' }, versions: { '1.0.0': '1.13.0' }, tracked: ['src/main.ts', 'src/styles.css', 'README.md', 'package-lock.json'],
});
test('release metadata accepts consistent versions and a matching tag', () => { assert.doesNotThrow(() => validateRelease(metadata(), '1.0.0')); });
test('release metadata rejects invalid tags and mismatched versions', () => {
    for (const tag of ['v1.0.0', '1.0.1', '1.0.0-rc.1']) assert.throws(() => validateRelease(metadata(), tag));
    const data = metadata(); data.pkg.version = '1.0.1'; assert.throws(() => validateRelease(data));
});
test('internal documents and generated assets cannot be tracked for publication', () => {
    for (const path of ['AGENTS.md', 'docs/internal.md', 'COMMUNITY_RELEASE_REVIEW.md', '.codex/settings.json', 'main.js', 'styles.css', 'data.json']) {
        const data = metadata(); data.tracked.push(path); assert.throws(() => validateRelease(data), /Forbidden tracked files/);
    }
});
