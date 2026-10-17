import assert from 'node:assert/strict';
import test from 'node:test';
import { loadTypeScript, obsidianMock } from './load-typescript.mjs';

const { BEGINNER_TIPS, pickBeginnerTip } = await loadTypeScript('src/beginnerTips.ts');
const {
    ONBOARDING_GUIDE_DIR,
    PRIMARY_ONBOARDING_GUIDE_PATH,
    ONBOARDING_GUIDE_NOTES,
    OnboardingGuideManager,
} = await loadTypeScript('src/onboardingGuides.ts');

test('a session can show the whole tip catalog without consecutive repeats', t => {
    let seed = 42;
    t.mock.method(Math, 'random', () => {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        return seed / 2 ** 32;
    });
    let previous; const seen = new Set();
    for (let index = 0; index < 1000; index++) {
        const tip = pickBeginnerTip();
        assert.ok(BEGINNER_TIPS.includes(tip));
        assert.notEqual(tip.id, previous);
        previous = tip.id; seen.add(tip.id);
    }
    assert.equal(seen.size, BEGINNER_TIPS.length);
});

test('random selection handles both ends of the random range without repeating', t => {
    let value = 0;
    t.mock.method(Math, 'random', () => value);
    let previous;
    for (value of [0, 0, 1 - Number.EPSILON, 1 - Number.EPSILON]) {
        const tip = pickBeginnerTip();
        assert.ok(tip);
        assert.notEqual(tip.id, previous);
        previous = tip.id;
    }
});

test('starter guide notes contain only Obsidian and core plugin content with zero Verbex references', () => {
    assert.equal(ONBOARDING_GUIDE_NOTES.length, 4);
    assert.equal(ONBOARDING_GUIDE_NOTES[0].path, PRIMARY_ONBOARDING_GUIDE_PATH);
    const knownPaths = new Set(ONBOARDING_GUIDE_NOTES.map(note => note.path.replace(/\.md$/, '')));
    const forbiddenTerms = [
        /verbex/i,
        /버벡스/,
        /obsidian-coach/i,
        /Related Notes/,
        /관련 노트\(Related Notes\)/,
        /Auto Mode/i,
        /\bProceed\b/,
        /\bDiff\b/,
        /\.hwpx?\b/i,
        /KORDOC/i,
        /@멘션/,
        /@ File/,
    ];

    for (const [index, note] of ONBOARDING_GUIDE_NOTES.entries()) {
        assert.equal(note.step, index + 1);
        assert.ok(note.path.startsWith(`${ONBOARDING_GUIDE_DIR}/`));
        assert.match(note.content, /^---\ncategory: 옵시디언가이드\nstep: [1-4]\n/);
        for (const pattern of forbiddenTerms) {
            assert.doesNotMatch(note.content, pattern, `Unexpected match ${pattern} in ${note.path}`);
        }
        const links = [...note.content.matchAll(/\[\[(Obsidian Guide\/[^\]|#]+)(?:#[^\]|]+)?\|[^\]]+\]\]/g)];
        assert.ok(links.length >= 1, `Expected internal guide links in ${note.path}`);
        for (const match of links) {
            assert.ok(knownPaths.has(match[1]), `Broken guide link target ${match[1]} in ${note.path}`);
        }
    }
});

function createOnboardingHost(initialState = '', showGuide = true) {
    const files = new Map();
    const opened = [];
    const savedStates = [];
    function makeFile(path, content) {
        return Object.assign(new obsidianMock.TFile(), {
            path,
            content,
            basename: path.split('/').at(-1).replace(/\.md$/, ''),
            extension: 'md',
            name: path.split('/').at(-1),
        });
    }
    const app = {
        vault: {
            getAbstractFileByPath: path => files.get(path) ?? null,
            createFolder: async path => {
                files.set(path, Object.assign(new obsidianMock.TFolder(), { path }));
            },
            create: async (path, content) => {
                if (files.has(path)) throw new Error(`File already exists: ${path}`);
                const item = makeFile(path, content);
                files.set(path, item);
                return item;
            },
        },
        workspace: {
            getLeaf: mode => ({
                openFile: async file => {
                    opened.push({ mode, path: file.path });
                },
            }),
        },
    };
    const plugin = {
        settings: { showGuide, onboardingSeedState: initialState },
        saveSettings: async () => {
            savedStates.push(plugin.settings.onboardingSeedState);
        },
    };
    return { app, plugin, files, opened, savedStates, makeFile, manager: new OnboardingGuideManager(app, plugin) };
}

test('OnboardingGuideManager seeds once, preserves deletions after completion, and supports open and restore', async () => {
    const host = createOnboardingHost('');
    const first = await host.manager.seedIfNeeded();
    assert.equal(first.status, 'seeded');
    assert.equal(first.createdPaths.length, 4);
    assert.deepEqual(host.savedStates, ['pending', 'complete']);

    // Deleting a guide note or all guides after completion must NOT re-seed on startup.
    host.files.delete(PRIMARY_ONBOARDING_GUIDE_PATH);
    const second = await host.manager.seedIfNeeded();
    assert.equal(second.status, 'skipped_already_seeded');
    assert.equal(host.files.has(PRIMARY_ONBOARDING_GUIDE_PATH), false);

    // Explicit open recreates only the requested guide note and opens it.
    host.files.delete(ONBOARDING_GUIDE_NOTES[1].path);
    const openResult = await host.manager.openGuide(1, true);
    assert.equal(openResult.status, 'created_and_opened');
    assert.equal(host.files.has(PRIMARY_ONBOARDING_GUIDE_PATH), true);
    assert.equal(host.files.has(ONBOARDING_GUIDE_NOTES[1].path), false);
    assert.deepEqual(host.opened, [{ mode: 'tab', path: PRIMARY_ONBOARDING_GUIDE_PATH }]);

    // Explicit restore recreates only missing notes without overwriting edited existing notes.
    host.files.get(PRIMARY_ONBOARDING_GUIDE_PATH).content = 'user-edited';
    const restoreResult = await host.manager.restoreMissingGuides();
    assert.equal(restoreResult.status, 'restored');
    assert.deepEqual(restoreResult.restoredPaths, [ONBOARDING_GUIDE_NOTES[1].path]);
    assert.equal(host.files.get(PRIMARY_ONBOARDING_GUIDE_PATH).content, 'user-edited');

    const secondRestore = await host.manager.restoreMissingGuides();
    assert.equal(secondRestore.status, 'nothing_missing');
});

test('OnboardingGuideManager adopts existing guides on upgrade and resumes interrupted pending seeds', async () => {
    const existingHost = createOnboardingHost('');
    existingHost.files.set(
        PRIMARY_ONBOARDING_GUIDE_PATH,
        existingHost.makeFile(PRIMARY_ONBOARDING_GUIDE_PATH, 'existing-step-1')
    );
    const adopted = await existingHost.manager.seedIfNeeded();
    assert.equal(adopted.status, 'adopted_existing_guides');
    assert.equal(existingHost.plugin.settings.onboardingSeedState, 'complete');
    assert.equal(existingHost.files.has(ONBOARDING_GUIDE_NOTES[1].path), false);

    const pendingHost = createOnboardingHost('pending');
    pendingHost.files.set(
        PRIMARY_ONBOARDING_GUIDE_PATH,
        pendingHost.makeFile(PRIMARY_ONBOARDING_GUIDE_PATH, 'keep-step-1')
    );
    const resumed = await pendingHost.manager.seedIfNeeded();
    assert.equal(resumed.status, 'seeded');
    assert.equal(resumed.createdPaths.length, 3);
    assert.equal(pendingHost.files.get(PRIMARY_ONBOARDING_GUIDE_PATH).content, 'keep-step-1');
    assert.equal(pendingHost.plugin.settings.onboardingSeedState, 'complete');
});
