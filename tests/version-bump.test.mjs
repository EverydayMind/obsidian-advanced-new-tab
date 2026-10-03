import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { bumpVersion } from '../version-bump.mjs';

async function fixture(t, version = '1.1.0') {
	const root = await realpath(tmpdir());
	const dir = await mkdtemp(join(root, 'advanced-new-tab-version-'));
	t.after(async () => {
		const target = await realpath(dir);
		if (dirname(target) !== root || !basename(target).startsWith('advanced-new-tab-version-')) {
			throw new Error('Refusing to remove a directory outside the test fixture.');
		}
		await rm(target, { recursive: true });
	});
	for (const [name, data] of Object.entries({
		'package.json': { version },
		'manifest.json': { id: 'advanced-new-tab', version: '1.0.0', minAppVersion: '1.13.0' },
		'versions.json': { '1.0.0': '1.13.0' },
	})) await writeFile(join(dir, name), JSON.stringify(data));
	return dir;
}

test('version bump keeps earlier compatibility entries and synchronizes manifest', async t => {
	const dir = await fixture(t);
	await bumpVersion(dir);
	const read = async name => JSON.parse(await readFile(join(dir, name), 'utf8'));
	assert.equal((await read('manifest.json')).version, '1.1.0');
	assert.deepEqual(await read('versions.json'), { '1.0.0': '1.13.0', '1.1.0': '1.13.0' });
});

test('invalid versions are rejected before changing release files', async t => {
	for (const version of ['v1.1.0', '1.1', '01.1.0', '1.1.0-beta']) {
		const dir = await fixture(t, version);
		await assert.rejects(bumpVersion(dir), /x.y.z/);
		assert.equal(JSON.parse(await readFile(join(dir, 'manifest.json'), 'utf8')).version, '1.0.0');
	}
});
