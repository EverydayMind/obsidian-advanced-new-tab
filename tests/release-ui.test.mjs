import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTypeScript } from './load-typescript.mjs';

const { highlightText } = await loadTypeScript('src/utils/highlightUtils.ts');
const { sectionOrder, moveItem } = await loadTypeScript('src/utils/sectionUtils.ts');
const { TextInputSuggester } = await loadTypeScript('src/suggester/suggester.ts', { stubSvelte: true });
const { getOmnisearchApi, getCorePlugin, executeAppCommand } = await loadTypeScript('src/integrations.ts');
const { en } = await loadTypeScript('src/i18n/locales/en.ts');
const { ko } = await loadTypeScript('src/i18n/locales/ko.ts');
const { HomeTabSettingTab, DEFAULT_SETTINGS } = await loadTypeScript('src/settings.ts');

test('HTML, regex syntax, and replacement patterns remain literal in highlights', () => {
    const attack = '<img src=x onerror="alert(1)"> <script>alert(2)</script> $& [a]';
    const parts = highlightText(attack, ['alert', '[a]', '$&', '', 'alert']);
    assert.equal(parts.map(part => part.text).join(''), attack);
    assert.deepEqual(parts.filter(part => part.match).map(part => part.text), ['alert', 'alert', '$&', '[a]']);
    assert.deepEqual(highlightText('<b>literal</b>', []), [{ text: '<b>literal</b>', match: false }]);
});

function host() {
    const input = new EventTarget();
    input.value = '';
    input.ownerDocument = { defaultView: { Event, setTimeout, clearTimeout } };
    let scopes = 0, removed = 0;
    const app = { scope: {}, keymap: { pushScope() { scopes++; }, popScope() { scopes--; } } };
    class DeferredSuggester extends TextInputSuggester {
        pending = [];
        getSuggestions(input) { return new Promise(resolve => this.pending.push({ input, resolve })); }
        useSelectedItem() {}
        getDisplayElementProps() { return {}; }
        getDisplayElementComponentType() { return class {}; }
        trackTestEvent() { this.trackEvent({ offref() { removed++; } }, {}); }
    }
    const suggester = new DeferredSuggester(app, input, {});
    return { input, suggester, scopes: () => scopes, removed: () => removed };
}

test('a slower search cannot replace a newer result', async () => {
    const h = host();
    h.input.value = 'first'; const first = h.suggester.onInput();
    h.input.value = 'second'; const second = h.suggester.onInput();
    h.suggester.pending[1].resolve(['new']); await second;
    h.suggester.pending[0].resolve(['old']); await first;
    assert.deepEqual(h.suggester.getSuggester().getSuggestions(), ['new']);
    assert.equal(h.scopes(), 1);
    h.suggester.destroy(); assert.equal(h.scopes(), 0);
});

test('blur and destroy cancel pending results, listeners, scopes, and events', async () => {
    const h = host();
    h.suggester.trackTestEvent();
    const first = h.suggester.onInput();
    h.input.dispatchEvent(new Event('blur'));
    h.suggester.pending[0].resolve(['late']); await first;
    assert.deepEqual(h.suggester.getSuggester().getSuggestions(), []);
    assert.equal(h.scopes(), 0);
    const second = h.suggester.onInput();
    h.suggester.destroy(); h.suggester.destroy();
    h.suggester.pending[1].resolve(['after destroy']); await second;
    h.input.dispatchEvent(new Event('focus'));
    h.input.dispatchEvent(new Event('input'));
    assert.equal(h.suggester.pending.length, 2);
    assert.equal(h.removed(), 1);
    assert.equal(h.scopes(), 0);
});

test('optional integrations gracefully handle disabled and missing APIs', () => {
    assert.equal(getCorePlugin({}, 'templates'), undefined);
    assert.equal(executeAppCommand({}, 'missing'), false);
    assert.equal(getOmnisearchApi({}, { omnisearch: { search() {} } }), undefined);
    const app = { plugins: { getPlugin() { return {}; } }, internalPlugins: { getPluginById() { return { enabled: false }; } } };
    assert.equal(getCorePlugin(app, 'templates'), undefined);
    assert.equal(getCorePlugin({ internalPlugins: { getPluginById: () => ({ instance: {} }) } }, 'templates'), undefined);
    assert.equal(getOmnisearchApi(app, { omnisearch: {} }), undefined);
    const api = { search() { return []; } };
    assert.equal(getOmnisearchApi(app, { omnisearch: api }), api);
});

test('settings translations have matching keys including descriptions and options', () => {
    assert.deepEqual(Object.keys(ko).sort(), Object.keys(en).sort());
});

test('declarative nested controls persist without mutating defaults', async () => {
    const tab = new HomeTabSettingTab();
    let saved = 0, updated = 0;
    tab.plugin = { settings: structuredClone(DEFAULT_SETTINGS), async saveSettings() { saved++; } };
    tab.app = {};
    tab.update = () => updated++;
    await tab.setControlValue('logo.imageLink', 'https://example.com/logo.png');
    assert.equal(tab.getControlValue('logo.imageLink'), 'https://example.com/logo.png');
    assert.equal(DEFAULT_SETTINGS.logo.imageLink, '');
    await tab.setControlValue('language', 'ko');
    assert.equal(saved, 2); assert.equal(updated, 1);
    const definitions = tab.getSettingDefinitions();
    assert.ok(definitions.every(definition => ['group', 'list'].includes(definition.type)));
    assert.ok(definitions.some(definition => definition.items?.some(row => row.control?.key === 'templateFolderOverride' && row.control.type === 'folder')));
});

test('section ordering tolerates duplicates, missing and unknown sections', () => {
    assert.deepEqual(sectionOrder('templates,bogus,templates'), ['templates', 'bookmarks', 'recent']);
    assert.deepEqual(moveItem(['a', 'b', 'c'], 0, 2), ['b', 'c', 'a']);
    assert.deepEqual(moveItem(['a', 'b'], -1, 0), ['a', 'b']);
});

test('declarative template target controls persist nested fields independently', async () => {
    const tab = new HomeTabSettingTab(); let saved = 0;
    tab.plugin = { settings: structuredClone(DEFAULT_SETTINGS), async saveSettings() { saved++; } };
    tab.plugin.settings.templateTargets.push({ template: 'Templates/Person.md', folder: '' });
    await tab.setControlValue('templateTargets.0.folder', 'People');
    assert.equal(tab.getControlValue('templateTargets.0.folder'), 'People'); assert.equal(saved, 1);
    assert.deepEqual(DEFAULT_SETTINGS.templateTargets, []);
});
