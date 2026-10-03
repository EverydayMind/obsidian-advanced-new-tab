import assert from 'node:assert/strict';
import test from 'node:test';
import { get, writable } from 'svelte/store';
import { loadTypeScript, obsidianMock } from './load-typescript.mjs';

const { appendCapture } = await loadTypeScript('src/utils/captureUtils.ts');
const { DailyCapture } = await loadTypeScript('src/dailyCapture.ts');
const { TemplateManager } = await loadTypeScript('src/templates.ts');
const { getSearchFiles } = await loadTypeScript('src/utils/getFilesUtils.ts');
const { bookmarkGroups, selectedBookmarks } = await loadTypeScript('src/utils/bookmarkUtils.ts');
const { excludedRecentPath, relativeTime } = await loadTypeScript('src/utils/recentUtils.ts');
const { showHoverPreview } = await loadTypeScript('src/hoverPreview.ts');
const ui = await loadTypeScript('tests/fixtures/p1.ts', { stubSvelte: true });
const now = obsidianMock.moment('2026-10-04T13:24:00');
function file(path, content = '') {
    return Object.assign(new obsidianMock.TFile(), { path, content, basename: path.split('/').at(-1).replace(/\.md$/, ''), extension: 'md', name: path.split('/').at(-1), stat: { mtime: 1 } });
}

test('capture inserts only into the matching section and ignores headings in YAML and fences', () => {
    const content = '---\ntitle: Draft\n---\n```md\n## Inbox\n```\n## Inbox\nkeep\n### Child\nchild\n\n## Later\nuntouched\n';
    const result = appendCapture(content, 'new\nline', 'Inbox');
    assert.equal(result, content.replace('child\n\n## Later', 'child\n- new line\n\n## Later'));
    assert.equal(appendCapture('a\r\n', 'b'), 'a\r\n- b\r\n');
    assert.equal(appendCapture('keep', '   '), 'keep');
    assert.equal(appendCapture('', 'b', 'Inbox'), '## Inbox\n- b\n');
    assert.throws(() => appendCapture('keep', 'b', 'a\nb'));
});

function captureHost(options = {}) {
    const files = new Map(); const processed = [];
    const app = {
        internalPlugins: { getPluginById: () => ({ enabled: true, instance: { options } }) },
        vault: {
            getAbstractFileByPath: path => files.get(path), getFileByPath: path => files.get(path) instanceof obsidianMock.TFile ? files.get(path) : null,
            cachedRead: async item => item.content,
            createFolder: async path => { files.set(path, Object.assign(new obsidianMock.TFolder(), { path })); },
            create: async (path, content) => { assert.ok(!files.has(path)); const item = file(path, content); files.set(path, item); return item; },
            process: async (item, change) => { processed.push(item); item.content = change(item.content); },
        },
    };
    const plugin = { settings: { captureEnabled: true, captureHeading: 'Inbox' } };
    return { app, plugin, files, processed, capture: new DailyCapture(app, plugin) };
}

test('concurrent captures create one daily note with configured date folders and template, then process it', async () => {
    const h = captureHost({ folder: 'Daily', format: 'YYYY/MM/DD', template: 'Templates/Daily' });
    h.files.set('Templates/Daily.md', file('Templates/Daily.md', '# {{title}}\n{{date:YYYY}}\n## Inbox\n\n## Keep\nold\n'));
    await Promise.all(['first', 'second', 'third'].map(text => h.capture.capture(text, now)));
    const item = h.files.get('Daily/2026/10/04.md');
    assert.equal(item.content, '# 04\n2026\n## Inbox\n- first\n- second\n- third\n\n## Keep\nold\n');
    assert.equal(h.processed.length, 2);
});

test('capture failure preserves content and the queue recovers; disabled capture does not write', async () => {
    const h = captureHost();
    const item = file('2026-10-04.md', 'original'); h.files.set(item.path, item);
    const process = h.app.vault.process; h.app.vault.process = async () => { throw new Error('write failed'); };
    await assert.rejects(h.capture.capture('lost?', now)); assert.equal(item.content, 'original');
    h.app.vault.process = process; await h.capture.capture('saved', now);
    assert.match(item.content, /- saved/); assert.ok(!item.content.includes('lost?'));
    h.plugin.settings.captureEnabled = false;
    await assert.rejects(h.capture.capture('disabled', now)); assert.ok(!item.content.includes('disabled'));
});

test('invalid paths, missing templates, and multiline headings are rejected before creating anything', async () => {
    for (const options of [{ folder: '../Outside' }, { template: 'missing' }]) {
        const h = captureHost(options); await assert.rejects(h.capture.capture('text', now)); assert.equal(h.files.size, 0);
    }
    const h = captureHost(); h.plugin.settings.captureHeading = 'a\nb';
    await assert.rejects(h.capture.capture('text', now)); assert.equal(h.files.size, 0);
});

test('heading indexing is opt-in and selection forwards the heading and new-tab flag', () => {
    const note = file('Folder/Note.md');
    const app = { vault: { getFiles: () => [note] }, metadataCache: { getFileCache: () => ({ headings: [{ heading: 'Unique target' }] }) } };
    assert.equal(getSearchFiles(app).length, 1);
    const result = getSearchFiles(app, false, true)[1]; assert.equal(result.heading, 'Unique target');
    const local = Object.create(ui.LocalSuggester.prototype); const calls = [];
    local.searchBar = { openFile: (...args) => calls.push(args) };
    local.useSelectedItem({ item: result }, true);
    assert.deepEqual(calls, [[note, true, 'Unique target']]);
});

test('standalone and embedded heading navigation preserve the host pane and source path', () => {
    const calls = []; const note = file('N.md'); const container = {};
    const leaf = { app: null, openFile: (...args) => calls.push(['host', ...args]), view: { containerEl: { contains: value => value === container } } };
    const app = { workspace: { iterateAllLeaves: fn => fn(leaf), getLeaf: mode => ({ openFile: (...args) => calls.push([mode, ...args]) }) } }; leaf.app = app;
    const plugin = { app, settings: {} };
    const view = new ui.HomeTabView(leaf, plugin); view.searchBar.openFile(note, false, 'Target');
    const embedded = new ui.EmbeddedHomeTab(container, plugin, '', 'Source.md'); embedded.searchBar.openFile(note, true, 'Target');
    assert.deepEqual(calls, [['host', note, { eState: { subpath: '#Target' } }], ['tab', note, { eState: { subpath: '#Target' } }]]);
    assert.equal(embedded.searchBar.sourcePath, 'Source.md');
});

test('template filter aliases list only templates, create on selection, and never create blank notes', async () => {
    assert.ok(ui.filterKeys.includes('tpl') && ui.filterKeys.includes('template'));
    const template = file('Templates/Person.md'); const calls = [];
    const local = Object.create(ui.LocalSuggester.prototype);
    local.templateMode = true; local.plugin = { settings: { maxResults: 5 }, templateManager: { getTemplateFiles: () => [template], createNoteFromTemplate: (...args) => calls.push(args) } };
    local.app = {}; local.close = () => {}; local.inputEl = { value: '' };
    assert.equal(local.getSuggestions('')[0].item.file, template);
    local.useSelectedItem(local.getSuggestions('Person')[0], true);
    assert.deepEqual(calls, [[template, true]]);
    await local.handleFileCreation(); // A Shift+Enter in template mode must be inert.
    assert.equal(calls.length, 1);
});

test('template folder mapping applies to numbered titles and defaults stay unchanged', async () => {
    const h = captureHost(); const opened = []; const template = file('Templates/Person.md', '{{title}}');
    h.files.set('People', Object.assign(new obsidianMock.TFolder(), { path: 'People' }));
    h.app.fileManager = { getNewFileParent: () => ({ path: 'Default' }) };
    h.app.workspace = { getLeaf: mode => ({ openFile: async item => opened.push({ mode, item }) }) };
    const plugin = { settings: { templateTargets: [{ template: template.path, folder: 'People' }], newNoteNameFormat: '{{template}}', templateWordsToStrip: '' } };
    const manager = new TemplateManager(h.app, plugin, writable([]), writable(''));
    await Promise.all([manager.createNoteFromTemplate(template), manager.createNoteFromTemplate(template, true)]);
    assert.equal(opened[0].item.path, 'People/Person.md'); assert.equal(opened[1].item.content, 'Person 1'); assert.equal(opened[1].mode, 'tab');
    plugin.settings.templateTargets = []; await manager.createNoteFromTemplate(template);
    assert.equal(opened[2].item.path, 'Default/Person.md');
});

test('nested bookmark group selection uses title paths, includes descendants, and missing groups stay empty', () => {
    const inner = { type: 'file', path: 'N.md' };
    const groups = [{ type: 'group', title: 'A/B', items: [{ type: 'group', title: 'Inner', items: [inner] }] }];
    const list = bookmarkGroups(groups); assert.equal(list[1].value, '["A/B","Inner"]');
    assert.deepEqual(selectedBookmarks(groups, list[1].value), [inner]);
    assert.deepEqual(selectedBookmarks(groups, '["missing"]'), []);
});

test('recent modified mode sorts mtime, excludes descendants but not similar folder names, and clears without deleting files', () => {
    const files = [file('Private/N.md'), file('Private2/N.md'), file('Other/N.md')]; files.forEach((item, i) => { item.stat.mtime = i + 1; });
    const settings = { recentFileMode: 'modified', recentExcludedFolders: 'Private', maxRecentFiles: 2 };
    const manager = new ui.RecentFileManager({ vault: { getFiles: () => files } }, { settings }); manager.refresh();
    assert.deepEqual(get(ui.recentFiles).map(item => item.file.path), ['Other/N.md', 'Private2/N.md']);
    manager.clear(); manager.refresh(); assert.deepEqual(get(ui.recentFiles), []); assert.equal(files.length, 3);
    assert.equal(excludedRecentPath('Private/sub/n.md', 'Private'), true); assert.equal(excludedRecentPath('Private2/n.md', 'Private'), false);
    assert.equal(relativeTime(60000, 'en', 120000), '1 minute ago');
});

test('hover events use the registered source and respect the toggle and markdown type', () => {
    const calls = []; const app = { workspace: { trigger: (...args) => calls.push(args) } }; const note = file('N.md'); const event = { currentTarget: {} };
    showHoverPreview(app, note, event, false); showHoverPreview(app, { ...note, extension: 'pdf' }, event, true); assert.equal(calls.length, 0);
    showHoverPreview(app, note, event, true); assert.equal(calls[0][0], 'hover-link'); assert.equal(calls[0][1].source, 'advanced-new-tab'); assert.equal(calls[0][1].targetEl, event.currentTarget);
});

test('capture clears the input only after success and preserves text typed during the write', async () => {
    const input = { value: 'original' }; let success = false;
    const bar = new ui.SearchBar({ settings: {}, captureToDailyNote: async () => success }, () => {});
    bar.searchBarEl = writable(input); bar.fileSuggester = { setInput: value => { input.value = value; } };
    await bar.captureInput(); assert.equal(input.value, 'original'); success = true;
    await bar.captureInput(); assert.equal(input.value, ''); input.value = 'old';
    bar.plugin.captureToDailyNote = async () => { input.value = 'new'; return true; };
    await bar.captureInput(); assert.equal(input.value, 'new');
});

test('today daily note invokes the enabled Daily notes core command', async () => {
    const calls = []; let enabled = true;
    const plugin = Object.create(ui.HomeTab.prototype);
    plugin.app = {
        internalPlugins: { getPluginById: id => id === 'daily-notes' ? { enabled } : undefined },
        commands: { executeCommandById(id) { calls.push(id); return true; } },
    };
    await plugin.openTodayDailyNote();
    assert.deepEqual(calls, ['daily-notes']);
    enabled = false;
    await plugin.openTodayDailyNote();
    assert.deepEqual(calls, ['daily-notes']);
    plugin.app = {};
    await plugin.openTodayDailyNote();
    assert.deepEqual(calls, ['daily-notes']);
});

test('expanded quick actions route folders, URLs, templates and files, checking core availability', async () => {
    const calls = []; let explorerEnabled = true;
    const folder = Object.assign(new obsidianMock.TFolder(), { path: 'People' }); const note = file('T.md');
    const leaf = { view: { revealInFolder: async target => calls.push(['folder', target]) } };
    const plugin = Object.create(ui.HomeTab.prototype);
    plugin.app = {
        internalPlugins: { getPluginById: () => ({ enabled: explorerEnabled }) },
        vault: { getAbstractFileByPath: () => folder, getFileByPath: () => note },
        workspace: { getLeavesOfType: () => [leaf], revealLeaf: async target => calls.push(['reveal', target]), getLeaf: mode => ({ openFile: async target => calls.push([mode, target]) }) },
    };
    plugin.openWebUrl = async (...args) => calls.push(['url', ...args]);
    plugin.templateManager = { createNoteFromTemplate: async (...args) => calls.push(['template', ...args]) };
    for (const kind of ['folder', 'url', 'template', 'file']) await plugin.runQuickAction({ kind, target: 'People', newTab: true });
    assert.deepEqual(calls, [['folder', folder], ['reveal', leaf], ['url', 'People', true], ['template', note, true], ['tab', note]]);
    explorerEnabled = false; const previous = calls.length; await plugin.runQuickAction({ kind: 'folder', target: 'People' }); assert.equal(calls.length, previous);
});

test('recent history batches saves, flushes on unload, and ignores a late layout-ready callback', async () => {
    const previousWindow = globalThis.window; const saves = []; const listeners = new Map(); let ready;
    globalThis.window = { setTimeout, clearTimeout };
    const a = file('A.md'); const b = file('B.md');
    const settings = { recentFileMode: 'opened', recentExcludedFolders: '', maxRecentFiles: 2, storeRecentFile: true, recentFilesStore: [] };
    const app = { workspace: { on: (name, callback) => { listeners.set(name, callback); return {}; }, onLayoutReady: callback => { ready = callback; } }, vault: { on: () => ({}), getFileByPath: () => null } };
    const manager = new ui.RecentFileManager(app, { settings, saveData: async value => saves.push(structuredClone(value.recentFilesStore)) });
    try {
        manager.onload(); ready(); listeners.get('file-open')(a); listeners.get('file-open')(b);
        assert.equal(saves.length, 0);
        manager.onunload(); assert.equal(saves.length, 1); assert.deepEqual(saves[0].map(item => item.filepath).sort(), ['A.md', 'B.md']);
        ready(); assert.equal(saves.length, 1);
        await new Promise(resolve => setTimeout(resolve, 300)); assert.equal(saves.length, 1);
    } finally { manager.onunload(); globalThis.window = previousWindow; }
});
