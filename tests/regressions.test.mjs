import assert from 'node:assert/strict';
import test from 'node:test';
import { loadTypeScript, obsidianMock } from './load-typescript.mjs';

const files = await loadTypeScript('src/utils/getFilesUtils.ts');
const { mergeSettings } = await loadTypeScript('src/utils/settingsUtils.ts');
const templates = await loadTypeScript('src/utils/templateUtils.ts');
const { TemplateManager } = await loadTypeScript('src/templates.ts');
const { parseWebUrl } = await loadTypeScript('src/utils/urlUtils.ts');
const { createTranslator } = await loadTypeScript('src/i18n/translator.ts');
const now = obsidianMock.moment('2026-04-14T16:01:00');

function makeApp(folder = 'Notes') {
	return {
		fileManager: { getNewFileParent: () => ({ path: folder }) },
		metadataCache: { getFileCache: () => null, unresolvedLinks: { 'Source.md': { Person: 1 } } },
		vault: { getFiles: () => [] },
	};
}

test('unresolved note uses the explicitly supplied app and default folder', () => {
	assert.equal(files.getUnresolvedLinkPath(makeApp(), 'Person.md', true), 'Notes/Person.md');
	assert.equal(files.getUnresolvedLinkPath(makeApp('Other'), 'Person.md', true), 'Other/Person.md');
});

test('root and explicit link folders produce vault-relative paths', () => {
	assert.equal(files.getUnresolvedLinkPath(makeApp('/'), 'Person.md', true), 'Person.md');
	assert.equal(files.getUnresolvedLinkPath(makeApp(), 'People/Person.md#Profile', true), 'People/Person.md');
});

test('search indexing reaches unresolved path creation without relying on global app', () => {
	const result = files.getSearchFiles(makeApp(), true);
	assert.equal(result.length, 1);
	assert.equal(result[0].path, 'Notes/Person.md');
	assert.equal(result[0].isUnresolved, true);
});

test('nested settings and stored arrays are independent of defaults and saved data', () => {
	const defaults = { logo: { imagePath: '', imageLink: '' }, recentFilesStore: [], showGuide: true };
	const saved = { logo: { imagePath: 'logo.png' }, recentFilesStore: [{ filepath: 'A.md' }] };
	const settings = mergeSettings(defaults, saved);
	assert.equal(settings.logo.imageLink, '');
	assert.equal(settings.showGuide, true);
	settings.logo.imagePath = 'changed.png';
	settings.recentFilesStore[0].filepath = 'B.md';
	assert.equal(defaults.logo.imagePath, '');
	assert.equal(saved.logo.imagePath, 'logo.png');
	assert.equal(saved.recentFilesStore[0].filepath, 'A.md');
});

test('first run and null stored settings receive separate defaults', () => {
	const defaults = { logo: { imagePath: '' }, recentFilesStore: [] };
	const first = mergeSettings(defaults, null);
	first.recentFilesStore.push('file');
	assert.deepEqual(mergeSettings(defaults).recentFilesStore, []);
});

test('existing Korean and English template naming stays identical across UI languages', () => {
	assert.equal(templates.generateTemplateNoteName('사람 템플릿', now), '사람 이름 (260414 1601)');
	assert.equal(templates.generateTemplateNoteName('Person TEMPLATE', now), 'Person 이름 (260414 1601)');
	assert.equal(templates.generateTemplateNoteName('template', now), '노트 이름 (260414 1601)');
});

test('custom naming formats support Moment tokens and literal strip words', () => {
	assert.equal(templates.generateTemplateNoteName('Person [draft]', now, '{{template}} {{date:YYYY-MM-DD}}', '[draft]'), 'Person 2026-04-14');
});

test('template variables use one timestamp, configured defaults, and final note title', () => {
	const content = '{{title}} | {{date}} | {{time}} | {{date:YYYY}} | {{time:HHmm}} | {{unknown}}';
	assert.equal(templates.renderTemplateContent(content, 'Person 1', now, 'DD/MM/YYYY', 'HH.mm'),
		'Person 1 | 14/04/2026 | 16.01 | 2026 | 1601 | {{unknown}}');
});

test('titles containing dollar replacement patterns are rendered literally', () => {
	assert.equal(templates.renderTemplateContent('{{title}}', '$& $1', now), '$& $1');
});

test('generated filenames remove filesystem-invalid characters', () => {
	assert.equal(templates.sanitizeNoteName('A/B:C*?"<>|.'), 'A-B-C------');
});

test('template creation uses public Vault API and numbered titles, with no rename', async () => {
	const app = makeApp();
	const created = new Map();
	const opened = [];
	app.internalPlugins = { getPluginById: () => ({ enabled: true, instance: {
		options: { dateFormat: 'YYYY', timeFormat: 'HHmm' },
		createNoteFromTemplate() { throw new Error('Internal creation must not be called'); },
	} }) };
	app.vault.getAbstractFileByPath = path => created.get(path);
	app.vault.cachedRead = async () => '{{title}} {{date}} {{time}}';
	app.vault.create = async (path, content) => { const file = { path, content }; created.set(path, file); return file; };
	app.workspace = { getLeaf: mode => ({ openFile: async file => opened.push({ mode, file }) }) };
	const plugin = { settings: { newNoteNameFormat: '{{template}}', templateWordsToStrip: 'template', debugLogging: false } };
	const manager = new TemplateManager(app, plugin, { set() {} }, { set() {} });
	await Promise.all([
		manager.createNoteFromTemplate({ basename: 'Person template' }),
		manager.createNoteFromTemplate({ basename: 'Person template' }, true),
	]);
	assert.equal(opened[0].file.path, 'Notes/Person.md');
	assert.equal(opened[1].file.path, 'Notes/Person 1.md');
	assert.match(opened[1].file.content, /^Person 1 \d{4} \d{4}$/);
	assert.equal(opened[1].mode, 'tab');
});

test('URL input accepts HTTP(S) and domains while rejecting note titles and unsafe schemes', () => {
	assert.equal(parseWebUrl('example.com/path?q=note'), 'https://example.com/path?q=note');
	assert.equal(parseWebUrl('HTTP://example.com'), 'http://example.com/');
	for (const value of ['Note title', 'Note.md', 'javascript:alert(1)', 'file:///C:/test', 'https://user:password@example.com', 'https://']) {
		assert.equal(parseWebUrl(value), null, value);
	}
});

test('unsupported languages fall back to English and regional Korean resolves correctly', () => {
	assert.equal(createTranslator('ja')('section.bookmarks'), 'Bookmarks');
	assert.equal(createTranslator('KO-KR')('section.bookmarks'), '북마크 열기');
});

test('translation placeholders retain literal URLs and missing variables remain visible', () => {
	assert.equal(createTranslator('en')('action.openLink', { url: 'https://example.com/$&' }), 'Open link: https://example.com/$&');
	assert.equal(createTranslator('en')('action.openLink', {}), 'Open link: {url}');
});
