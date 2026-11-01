// Sanitized production excerpt: no user, database, or payment data is involved.
import crypto from 'node:crypto';

export const PRIZES = [
    { key: 'discount', value: 0.2, title: 'Bonus 0.2%',        weight: 50_000 },
    { key: 'discount', value: 0.3, title: 'Bonus 0.3%',        weight: 25_000 },
    { key: 'discount', value: 0.5, title: 'Bonus 0.5%',        weight: 12_000 },
    { key: 'discount', value: 1,   title: 'Cashback 1%',       weight: 800  },
    { key: 'discount', value: 1.5, title: 'Cashback 1.5%',     weight: 300  },
    { key: 'discount', value: 2,   title: 'Cashback 2%',       weight: 100  },
    { key: 'discount', value: 2.5, title: 'Super bonus 2.5%',  weight: 7    },
    { key: 'discount', value: 3,   title: 'Super bonus 3%',    weight: 5    },
    { key: 'jackpot',  value: 1,   title: 'Jackpot: 1 item',   weight: 3    },
    { key: 'jackpot',  value: 5,   title: 'Jackpot: 5 items',  weight: 1    }
];
const TOTAL = PRIZES.reduce((s, p) => s + p.weight, 0);

export function pickPrize() {
    const r = crypto.randomInt(1, TOTAL + 1);
    let acc = 0;

    const chosen = PRIZES.find(p => (acc += p.weight) >= r);

    const { weight, ...prizeWithoutWeight } = chosen;
    return prizeWithoutWeight;
}

