import crypto from 'node:crypto';

export const PRIZES = Object.freeze([
  { id: 'bonus-small', kind: 'balance-bonus', value: 0.2, weight: 50_000 },
  { id: 'bonus-medium', kind: 'balance-bonus', value: 0.5, weight: 12_000 },
  { id: 'bonus-large', kind: 'balance-bonus', value: 1, weight: 800 },
  { id: 'jackpot', kind: 'item', value: 1, weight: 3 }
]);

export const utcDayKey = (date) => date.toISOString().slice(0, 10);

export function pickWeightedPrize(prizes, randomInt = crypto.randomInt) {
  if (!Array.isArray(prizes) || prizes.length === 0) {
    throw new TypeError('prizes must be a non-empty array');
  }

  const totalWeight = prizes.reduce((total, prize) => {
    if (!Number.isSafeInteger(prize.weight) || prize.weight <= 0) {
      throw new TypeError('every prize must have a positive integer weight');
    }
    return total + prize.weight;
  }, 0);

  const ticket = randomInt(1, totalWeight + 1);
  let boundary = 0;

  for (const prize of prizes) {
    boundary += prize.weight;
    if (ticket <= boundary) {
      const { weight, ...safePrize } = prize;
      return safePrize;
    }
  }

  throw new Error('random source returned a value outside the requested range');
}

export function spinDailyReward({ lastSpinAt, now = new Date(), prizes = PRIZES, randomInt }) {
  const today = utcDayKey(now);
  const lastSpinDay = lastSpinAt ? utcDayKey(new Date(lastSpinAt)) : null;

  if (lastSpinDay === today) {
    return { allowed: false, reason: 'already-spun-today', prize: null };
  }

  return {
    allowed: true,
    reason: null,
    prize: pickWeightedPrize(prizes, randomInt)
  };
}

