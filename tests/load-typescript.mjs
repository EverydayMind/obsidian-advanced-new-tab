import { build } from 'esbuild';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

export const obsidianMock = {
	Component: class {},
	PluginSettingTab: class {},
	AbstractInputSuggest: class {},
	getIconIds: () => ['file', 'search'],
	getLanguage: () => 'en',
	Scope: class { register() {} },
	Platform: { isDesktop: true },
	Notice: class {},
	TFile: class {},
	TFolder: class {},
	Vault: { recurseChildren(folder, callback) { for (const file of folder.children) callback(file); } },
	moment: require('moment'),
	getLinkpath: path => path.split('#')[0],
	normalizePath: path => path.replace(/\\/g, '/').replace(/\/+/g, '/').replace(/^\/|\/$/g, ''),
};

export async function loadTypeScript(entry, { stubSvelte = false } = {}) {
	const result = await build({
		entryPoints: [entry], bundle: true, write: false, platform: 'node',
		format: 'cjs', external: ['obsidian', 'moment', ...(stubSvelte ? ['svelte'] : [])], logLevel: 'silent',
		plugins: stubSvelte ? [{ name: 'test-svelte-host', setup(builder) {
			builder.onLoad({ filter: /\.svelte$/ }, () => ({ contents: 'export default class { $destroy() {} }', loader: 'js' }));
		} }] : [],
	});
	const module = { exports: {} };
	new Function('require', 'module', 'exports', result.outputFiles[0].text)(
		name => name === 'obsidian' ? obsidianMock : name === 'svelte' && stubSvelte
			? { mount: () => ({}), unmount: async () => {}, flushSync: callback => callback() }
			: require(name), module, module.exports,
	);
	return module.exports;
}
