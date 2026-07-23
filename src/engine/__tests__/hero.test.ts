import { assignHero, heroName } from '../hero';

describe('assignHero (3×3 grid: bedtime × duration)', () => {
  it.each([
    [{ bedMin: 540, wakeMin: 960 }, 'monk'], // early, 7.0h
    [{ bedMin: 540, wakeMin: 1050 }, 'ranger'], // early, 8.5h
    [{ bedMin: 540, wakeMin: 1080 }, 'druid'], // early, 9.0h
    [{ bedMin: 690, wakeMin: 1140 }, 'rogue'], // normal, 7.5h
    [{ bedMin: 660, wakeMin: 1170 }, 'knight'], // normal, 8.5h
    [{ bedMin: 630, wakeMin: 1170 }, 'paladin'], // normal, 9.0h
    [{ bedMin: 750, wakeMin: 1170 }, 'ninja'], // late, 7.0h
    [{ bedMin: 720, wakeMin: 1230 }, 'mage'], // late, 8.5h
    [{ bedMin: 750, wakeMin: 1290 }, 'warlock'], // late, 9.0h
  ] as const)('window %j → %s', (window, hero) => {
    expect(assignHero(window)).toBe(hero);
  });

  it.each([
    [{ bedMin: 599, wakeMin: 1019 }, 'monk'], // 21:59 is still "early"
    [{ bedMin: 600, wakeMin: 1020 }, 'rogue'], // 22:00 starts "normal"
    [{ bedMin: 719, wakeMin: 1139 }, 'rogue'], // 23:59 is still "normal"
    [{ bedMin: 720, wakeMin: 1140 }, 'ninja'], // 00:00 starts "late"
  ] as const)('bedtime boundary %j → %s', (window, hero) => {
    expect(assignHero(window)).toBe(hero);
  });
});

describe('heroName', () => {
  it('capitalizes the hero name', () => {
    expect(heroName('warlock')).toBe('Warlock');
  });
});
