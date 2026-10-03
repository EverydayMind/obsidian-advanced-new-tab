import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { build } from 'esbuild';
import esbuildSvelte from 'esbuild-svelte';
import svelteConfig from '../svelte.config.mjs';
import { resolve } from 'node:path';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://local.test' });
for (const key of ['window', 'document', 'Node', 'Element', 'HTMLElement', 'HTMLInputElement', 'HTMLMediaElement', 'DocumentFragment', 'Text', 'Comment', 'Event', 'MouseEvent']) {
    Object.defineProperty(globalThis, key, { value: dom.window[key], configurable: true });
}
const bundle = await build({
    stdin: { contents: `
        import { mount, unmount, flushSync } from 'svelte';
        import { writable, get } from 'svelte/store';
        import Homepage from './src/ui/homepage.svelte';
        import HighlightedText from './src/ui/svelteComponents/highlightedText.svelte';
        import SuggesterView from './src/ui/suggesterView.svelte';
        import LocalSuggestion from './src/ui/svelteComponents/homeTabFileSuggestion.svelte';
        import { DEFAULT_SETTINGS } from './src/settingsData';
        import { pluginSettingsStore, templateStatus, recentFiles } from './src/store';
        import { initI18n } from './src/i18n';
        import { highlightText } from './src/utils/highlightUtils';
        import { Suggester } from './src/suggester/suggester';
        import { executeCoreAction } from './src/coreActions';
        import { RecentFileManager } from './src/recentFiles';
        import { bookmarkedFilesManager } from './src/bookmarkedFiles';
        import { TFile } from 'obsidian';
        export { mount, unmount, flushSync, writable, get, Homepage, HighlightedText, SuggesterView, LocalSuggestion, DEFAULT_SETTINGS, pluginSettingsStore, templateStatus, recentFiles, initI18n, highlightText, Suggester, executeCoreAction, RecentFileManager, bookmarkedFilesManager, TFile };
    `, resolveDir: process.cwd(), loader: 'ts' },
    bundle: true, write: false, outfile: 'dom-test.js', format: 'cjs', platform: 'browser', logLevel: 'silent',
    alias: { obsidian: resolve('tests/fixtures/obsidian-ui.mjs') },
    plugins: [esbuildSvelte(svelteConfig)],
});
const module = { exports: {} };
new Function('module', 'exports', bundle.outputFiles.find(file => !file.path.endsWith('.css')).text)(module, module.exports);
const ui = module.exports;

test('Svelte mounts real input bindings and reacts to translated settings and quick-action changes', async () => {
    const target = document.createElement('div'); document.body.appendChild(target);
    const calls = [];
    const settings = structuredClone(ui.DEFAULT_SETTINGS);
    settings.logoType = 'lucideIcon'; settings.logo.lucideIcon = 'search';
    settings.quickActions = [{ kind: 'command', label: 'Capture', target: 'capture', icon: 'file', newTab: false }];
    const plugin = { settings, app: { vault: { adapter: {} } }, runCoreAction() {}, runQuickAction(action) { calls.push(action.target); } };
    const searchBar = { searchBarEl: ui.writable(), activeExtEl: ui.writable(), suggestionContainerEl: ui.writable(), updateActiveSuggester() {} };
    ui.pluginSettingsStore.set(settings); ui.initI18n('ko');
    const component = ui.flushSync(() => ui.mount(ui.Homepage, { target, props: { plugin, HomeTabSearchBar: searchBar } }));
    assert.equal(ui.get(searchBar.searchBarEl), target.querySelector('input'));
    assert.match(target.querySelector('input').placeholder, /파일/);
    assert.equal(target.querySelectorAll('svg[data-icon="search"]').length, 1);
    [...target.querySelectorAll('button')].find(button => button.textContent.includes('Capture')).click();
    assert.deepEqual(calls, ['capture']);
    settings.showQuickActions = false; ui.pluginSettingsStore.set(settings); ui.initI18n('en'); ui.flushSync();
    assert.match(target.querySelector('input').placeholder, /Search files/);
    assert.ok(!target.textContent.includes('Capture'));
    await ui.unmount(component); assert.equal(target.children.length, 0); target.remove();
});

test('real Svelte highlighting renders hostile markup as text with safe highlight spans', async () => {
    const target = document.createElement('div'); document.body.appendChild(target);
    const attack = '<img src=x onerror="window.pwned=1"> <script>window.pwned=2</script> $&';
    const component = ui.flushSync(() => ui.mount(ui.HighlightedText, { target, props: { parts: ui.highlightText(attack, ['window', '$&']) } }));
    assert.equal(target.textContent, attack);
    assert.equal(target.querySelectorAll('img,script').length, 0);
    assert.equal(target.querySelectorAll('.suggestion-highlight').length, 3);
    assert.equal(window.pwned, undefined);
    await ui.unmount(component); target.remove();
});

test('touch selection opens the tapped suggestion even without a preceding mouse move', async () => {
    const target = document.createElement('div'); document.body.appendChild(target);
    const used = [];
    const controller = { useSelectedItem(item) { used.push(item.item.basename); }, scrollSelectedItemIntoView() {} };
    const suggester = new ui.Suggester(controller, { register() {} });
    const result = name => ({ item: { basename: name, name, path: `${name}.md`, isCreated: true, fileType: 'markdown', extension: 'md' }, refIndex: 0 });
    suggester.setSuggestions([result('first'), result('second')]);
    const inputSuggester = { ...controller, getSuggester: () => suggester, getDisplayElementComponentType: () => ui.LocalSuggestion, getDisplayElementProps: item => ({ nameToDisplay: item.item.basename }) };
    const component = ui.flushSync(() => ui.mount(ui.SuggesterView, { target, props: { options: {}, textInputSuggester: inputSuggester } }));
    target.querySelectorAll('[role="option"]')[1].click();
    assert.deepEqual(used, ['second']);
    await ui.unmount(component); target.remove();
});

test('native new-tab buttons follow every core-plugin combination and forward click modifiers', async () => {
    const target = document.createElement('div'); document.body.appendChild(target);
    const ids = ['bases', 'canvas', 'webviewer'];
    const labels = ['새 베이스', '새 캔버스', '웹 뷰어 열기'];
    const commands = ['bases:new-file', 'canvas:new-file', 'webviewer:open'];
    const enabled = new Set(); const calls = []; const listeners = new Set();
    const settings = structuredClone(ui.DEFAULT_SETTINGS);
    const app = {
        vault: { adapter: {} },
        internalPlugins: { getPluginById: id => ({ enabled: enabled.has(id) }) },
        commands: { executeCommandById(id, event) { calls.push({ id, event }); return true; } },
        workspace: { on(name, callback) { assert.equal(name, 'layout-change'); listeners.add(callback); return callback; }, offref(callback) { listeners.delete(callback); } },
    };
    const plugin = { settings, app, runCoreAction: (id, event) => ui.executeCoreAction(app, id, event) };
    const searchBar = { searchBarEl: ui.writable(), activeExtEl: ui.writable(), suggestionContainerEl: ui.writable(), updateActiveSuggester() {} };
    ui.pluginSettingsStore.set(settings); ui.initI18n('ko');
    const component = ui.flushSync(() => ui.mount(ui.Homepage, { target, props: { plugin, HomeTabSearchBar: searchBar } }));
    assert.equal(listeners.size, 1);
    for (let mask = 0; mask < 8; mask++) {
        enabled.clear(); ids.forEach((id, index) => { if (mask & (1 << index)) enabled.add(id); });
        for (const callback of listeners) callback(); ui.flushSync();
        const buttons = [...target.querySelectorAll('.advanced-new-tab-action-button')];
        assert.deepEqual(buttons.map(button => button.textContent.trim()), ['새 노트', ...labels.filter((_, index) => mask & (1 << index))]);
        assert.equal(buttons[0].querySelector('svg').getAttribute('data-icon'), 'lucide-square-pen');
        const available = [
            { label: '새 노트', command: 'file-explorer:new-file' },
            ...ids.flatMap((id, index) => enabled.has(id) ? [{ label: labels[index], command: commands[index] }] : []),
        ];
        for (const action of available) {
            for (const modifiers of [{}, { ctrlKey: true }, { metaKey: true }, { shiftKey: true }]) {
                const previousCount = calls.length;
                const event = new MouseEvent('click', { bubbles: true, ...modifiers });
                buttons.find(button => button.textContent.trim() === action.label).dispatchEvent(event);
                assert.equal(calls.length, previousCount + 1);
                assert.equal(calls.at(-1).id, action.command);
                assert.equal(calls.at(-1).event, event);
            }
        }
    }
    const staleButton = [...target.querySelectorAll('button')].find(button => button.textContent.trim() === '웹 뷰어 열기');
    enabled.delete('webviewer'); const previousCount = calls.length; staleButton.click();
    assert.equal(calls.length, previousCount); // Recheck enablement at click time.
    await ui.unmount(component); assert.equal(listeners.size, 0); target.remove();
});

test('deleting a file outside the recent list preserves the last entry', () => {
    const first = new ui.TFile(); const last = new ui.TFile();
    ui.recentFiles.set([{ file: first, timestamp: 2 }, { file: last, timestamp: 1 }]);
    const manager = new ui.RecentFileManager({}, { settings: { storeRecentFile: false } });
    manager.removeRecentFile(new ui.TFile());
    assert.deepEqual(ui.get(ui.recentFiles).map(item => item.file), [first, last]);
    manager.removeRecentFile(first);
    assert.deepEqual(ui.get(ui.recentFiles).map(item => item.file), [last]);
    ui.recentFiles.set([]);
});

test('nested bookmarks resolve files once and remove the matching nested bookmark', () => {
    const file = Object.assign(new ui.TFile(), { path: 'folder/note.md' });
    const nested = { type: 'file', path: file.path };
    const items = [{ type: 'group', items: [{ type: 'group', items: [nested] }] }, { type: 'file', path: file.path }, { type: 'file', path: 'missing.md' }];
    const removed = [];
    const api = { getBookmarks: () => items, removeItem: item => removed.push(item) };
    const app = { internalPlugins: { getPluginById: () => ({ enabled: true, instance: api }) }, vault: { getAbstractFileByPath: path => path === file.path ? file : null } };
    const store = ui.writable([{ file, iconId: 'file' }]);
    const manager = new ui.bookmarkedFilesManager(app, { settings: {}, async saveData() {} }, store);
    assert.deepEqual(manager.getBookmarkedFiles(), [file]);
    manager.updateFileIcon(new ui.TFile(), 'search');
    assert.equal(ui.get(store)[0].iconId, 'file');
    manager.removeBookmark(file); assert.deepEqual(removed, [nested]);
});

test('Alt+Enter capture is opt-in and does not trigger a search selection', async () => {
    const target = document.createElement('div'); document.body.appendChild(target); const calls = [];
    const settings = structuredClone(ui.DEFAULT_SETTINGS); const plugin = { settings, app: { vault: { adapter: {} } } };
    const searchBar = { searchBarEl: ui.writable(), activeExtEl: ui.writable(), suggestionContainerEl: ui.writable(), captureEnabled: false, captureInput: async () => calls.push('capture') };
    ui.pluginSettingsStore.set(settings);
    const component = ui.flushSync(() => ui.mount(ui.Homepage, { target, props: { plugin, HomeTabSearchBar: searchBar } }));
    const input = target.querySelector('input');
    input.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', altKey: true, bubbles: true, cancelable: true })); assert.deepEqual(calls, []);
    searchBar.captureEnabled = true;
    const event = new window.KeyboardEvent('keydown', { key: 'Enter', altKey: true, bubbles: true, cancelable: true }); input.dispatchEvent(event);
    assert.deepEqual(calls, ['capture']); assert.equal(event.defaultPrevented, true);
    await ui.unmount(component); target.remove();
});
