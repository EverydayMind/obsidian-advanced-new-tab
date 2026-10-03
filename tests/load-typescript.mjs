import { build } from 'esbuild';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

export const obsidianMock = {
	Component: class {},
	Notice: class {},
	TFile: class {},
	TFolder: class {},
	Vault: { recurseChildren(folder, callback) { for (const file of folder.children) callback(file); } },
	moment: require('moment'),
	getLinkpath: path => path.split('#')[0],
	normalizePath: path => path.replace(/\\/g, '/').replace(/\/+/g, '/').replace(/^\/|\/$/g, ''),
};

export async function loadTypeScript(entry) {
	const result = await build({
		entryPoints: [entry], bundle: true, write: false, platform: 'node',
		format: 'cjs', external: ['obsidian', 'moment'], logLevel: 'silent',
	});
	const module = { exports: {} };
	new Function('require', 'module', 'exports', result.outputFiles[0].text)(
		name => name === 'obsidian' ? obsidianMock : require(name), module, module.exports,
	);
	return module.exports;
}
