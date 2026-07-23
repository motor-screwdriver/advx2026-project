import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';
import { useGameStore } from '../store';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

const WINDOW = { bedMin: 690, wakeMin: 1140 }; // 23:30 → 07:00 → rogue
const DAY1 = new Date('2026-07-15T08:00:00Z');
const DAY2 = new Date('2026-07-16T08:00:00Z');
const DAY9 = new Date('2026-07-23T08:00:00Z');

function onboard(window = WINDOW) {
  useGameStore.getState().setWindow(window);
  useGameStore.getState().assignHeroForWindow();
}

function terribleNight(now: Date) {
  useGameStore.getState().checkIn('bed', useGameStore.getState().game.window!.bedMin);
  useGameStore.getState().checkIn('wake', useGameStore.getState().game.window!.bedMin + 180);
  return useGameStore.getState().evaluateCurrentNight(now);
}

beforeEach(() => {
  useGameStore.getState().reset();
});

describe('Second Wind artifact — once per 7 days', () => {
  it('softens only the first TERRIBLE of the week, recharges after 7 days', () => {
    onboard();
    useGameStore.setState({
      game: { ...useGameStore.getState().game, artifacts: ['second_wind'] },
    });
    expect(terribleNight(DAY1)?.hpDelta).toBe(-1); // charge spent
    expect(terribleNight(DAY2)?.hpDelta).toBe(-2); // full damage
    expect(terribleNight(DAY9)?.hpDelta).toBe(-1); // recharged
  });

  it('does nothing without the artifact', () => {
    onboard();
    expect(terribleNight(DAY1)?.hpDelta).toBe(-2);
  });
});

describe('death, Phoenix Feather and resurrection', () => {
  it('Phoenix Feather auto-revives at 3 HP without the weekly cooldown', () => {
    onboard();
    useGameStore.setState({
      game: {
        ...useGameStore.getState().game,
        hp: 1,
        artifacts: ['phoenix_feather'],
        nights: [
          {
            date: '2026-07-14',
            bedTime: 690,
            wakeTime: 1140,
            score: 100,
            outcome: 'PERFECT',
            hpDelta: 1,
            pixel: 'GOLD',
          },
        ],
      },
    });
    terribleNight(DAY1);
    const s = useGameStore.getState();
    expect(s.game.hp).toBe(3);
    expect(s.game.artifacts).toEqual([]);
    expect(s.game.lastResurrectionAt).toBeNull();
    expect(s.events.map((e) => e.type)).toContain('RESURRECTED');
  });

  it('resurrection cooldown gates applyResurrection', () => {
    onboard();
    const s = useGameStore.getState();
    expect(s.canResurrect(DAY1)).toBe(true);
    s.applyResurrection(true, DAY1);
    expect(useGameStore.getState().game.hp).toBe(3);
    expect(useGameStore.getState().canResurrect(DAY2)).toBe(false);
    useGameStore.getState().applyResurrection(true, DAY2); // blocked
    expect(useGameStore.getState().game.lastResurrectionAt).toBe(DAY1.toISOString());
    expect(useGameStore.getState().canResurrect(DAY9)).toBe(true);
  });

  it('failed resurrection is permanent; startNewHero re-summons', () => {
    onboard();
    useGameStore.getState().applyResurrection(false, DAY1);
    expect(useGameStore.getState().game.hero).toBeNull();
    useGameStore.getState().startNewHero();
    const { game } = useGameStore.getState();
    expect(game.hero?.type).toBe('rogue');
    expect(game.hp).toBe(7);
    expect(game.artifacts).toEqual([]);
  });
});

describe('Iron Armor — consumed once', () => {
  it('absorbs a single HP loss', () => {
    onboard();
    useGameStore.setState({
      game: { ...useGameStore.getState().game, artifacts: ['iron_armor'] },
    });
    terribleNight(DAY1);
    expect(useGameStore.getState().game.hp).toBe(7);
    expect(useGameStore.getState().game.artifacts).toEqual([]);
    terribleNight(DAY2);
    expect(useGameStore.getState().game.hp).toBe(5);
  });
});
