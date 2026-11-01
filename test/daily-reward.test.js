import test from 'node:test';
import assert from 'node:assert/strict';
import { pickWeightedPrize, spinDailyReward, utcDayKey } from '../src/daily-reward/engine.js';

test('utcDayKey does not depend on the local timezone', () => {
  assert.equal(utcDayKey(new Date('2026-01-01T23:30:00-03:00')), '2026-01-02');
});

test('weighted selection respects the first and last tickets', () => {
  const prizes = [{ id: 'first', weight: 2 }, { id: 'last', weight: 3 }];
  assert.equal(pickWeightedPrize(prizes, () => 1).id, 'first');
  assert.equal(pickWeightedPrize(prizes, () => 5).id, 'last');
});

test('a user cannot spin twice on the same UTC day', () => {
  const result = spinDailyReward({
    lastSpinAt: '2026-05-10T00:01:00.000Z',
    now: new Date('2026-05-10T23:59:59.000Z'),
    randomInt: () => 1
  });
  assert.deepEqual(result, { allowed: false, reason: 'already-spun-today', prize: null });
});

test('a spin on the following UTC day is allowed', () => {
  const result = spinDailyReward({
    lastSpinAt: '2026-05-10T23:59:59.000Z',
    now: new Date('2026-05-11T00:00:00.000Z'),
    prizes: [{ id: 'reward', kind: 'balance-bonus', value: 1, weight: 1 }],
    randomInt: () => 1
  });
  assert.equal(result.allowed, true);
  assert.equal(result.prize.id, 'reward');
});

