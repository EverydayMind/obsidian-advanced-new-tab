import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTypeScript, obsidianMock } from './load-typescript.mjs';
const { openInWebViewer } = await loadTypeScript('src/webViewer.ts');
const { default: LocalSuggester } = await loadTypeScript('src/suggester/homeTabSuggester.ts', { stubSvelte: true });
const { default: OmniSuggester } = await loadTypeScript('src/suggester/omnisearchSuggester.ts', { stubSvelte: true });
const { default: SurfingSuggester } = await loadTypeScript('src/suggester/surfingSuggester.ts', { stubSvelte: true });

test('local, Omnisearch and Surfing modes route URL selections through the same host callback', async () => {
    for (const Type of [LocalSuggester, OmniSuggester, SurfingSuggester]) {
        const suggester = Object.create(Type.prototype);
        const calls = [];
        suggester.close = () => {};
        suggester.plugin = { settings: { maxResults: 5 } };
        suggester.fuzzySearch = { rawSearch() { return []; } };
        suggester.searchBar = { openUrl(url, newTab) { calls.push({ url, newTab }); } };
        const item = Type === SurfingSuggester
            ? { item: { url: 'example.com' } }
            : (await suggester.getSuggestions('example.com'))[0];
        suggester.useSelectedItem(item, true);
        assert.deepEqual(calls, [{ url: 'https://example.com/', newTab: true }]);
    }
});

test('URLs open in the actual host leaf using Web viewer state without Surfing', async () => {
    const states = [];
    const leaf = { async setViewState(state) { states.push(state); } };
    const app = {
        internalPlugins: { getPluginById(id) { assert.equal(id, 'webviewer'); return { enabled: true }; } },
        workspace: { getLeaf() { throw new Error('Must use the supplied host leaf'); } },
    };
    assert.equal(await openInWebViewer(app, 'example.com/path', false, leaf), 'opened');
    assert.deepEqual(states, [{ type: 'webviewer', active: true, state: { url: 'https://example.com/path', navigate: true } }]);
});

test('Ctrl/Cmd open creates a Web viewer tab', async () => {
    let opened;
    const app = {
        internalPlugins: { getPluginById() { return { enabled: true }; } },
        workspace: { getLeaf(mode) { assert.equal(mode, 'tab'); return { async setViewState(state) { opened = state; } }; } },
    };
    assert.equal(await openInWebViewer(app, 'https://example.com', true), 'opened');
    assert.equal(opened.type, 'webviewer');
});

test('disabled Web viewer, mobile, and unsafe URLs never navigate', async () => {
    const app = { internalPlugins: { getPluginById() { return { enabled: false }; } }, workspace: { getLeaf() { throw new Error('Unexpected navigation'); } } };
    assert.equal(await openInWebViewer(app, 'https://example.com'), 'unavailable');
    assert.equal(await openInWebViewer(app, 'javascript:alert(1)'), 'invalid');
    obsidianMock.Platform.isDesktop = false;
    try { assert.equal(await openInWebViewer({}, 'https://example.com'), 'unavailable'); }
    finally { obsidianMock.Platform.isDesktop = true; }
});
