import assert from 'node:assert/strict';
import test from 'node:test';
import { loadTypeScript } from './load-typescript.mjs';

const { BEGINNER_TIPS, pickBeginnerTip } = await loadTypeScript('src/beginnerTips.ts');

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
