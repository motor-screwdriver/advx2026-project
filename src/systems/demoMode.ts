/**
 * Demo mode (P0, booth-critical). The panel runs full simulated nights
 * through the REAL store, so judges see the actual morning-scene / death
 * flow. A snapshot is taken before the first demo action and [Reset]
 * restores it byte-for-byte — real data survives the demo (spec NFR-12).
 * Reachable only via the hidden 5-tap gesture in Settings, never by accident.
 */
import { router } from 'expo-router';

import { mockGameState } from '../contracts/mock';
import { useGameStore } from '../state/store';
import { demoCheckIns, type DemoNightKind } from './demoNights';

/** Panel actions: [Perfect Night] [Bad Night] [Death] — [Reset] is separate. */
export type DemoPanelAction = Exclude<DemoNightKind, 'terrible'> | 'death';

type StoreSnapshot = Pick<
  ReturnType<(typeof useGameStore)['getState']>,
  | 'game'
  | 'meta'
  | 'pendingBedTime'
  | 'pendingWakeTime'
  | 'lastEvaluation'
  | 'pendingChest'
  | 'events'
>;

const MAX_DEATH_NIGHTS = 10; // worst case: grace night + Iron Armor + 7 hearts

let snapshot: StoreSnapshot | null = null;

export function hasDemoSnapshot(): boolean {
  return snapshot !== null;
}

function takeSnapshot(): StoreSnapshot {
  const s = useGameStore.getState();
  return {
    game: s.game,
    meta: s.meta,
    pendingBedTime: s.pendingBedTime,
    pendingWakeTime: s.pendingWakeTime,
    lastEvaluation: s.lastEvaluation,
    pendingChest: s.pendingChest,
    events: s.events,
  };
}

/** Fresh installs get a playable hero first, so every button "just works". */
function ensurePlayableState(): void {
  const { game } = useGameStore.getState();
  if (!game.window || !game.hero) {
    useGameStore.setState({ game: { ...mockGameState(), demoMode: true } });
  }
}

function runOneNight(kind: DemoNightKind): void {
  const s = useGameStore.getState();
  if (!s.game.window) {
    return;
  }
  const { bedTime, wakeTime } = demoCheckIns(s.game.window, kind);
  s.checkIn('bed', bedTime);
  s.checkIn('wake', wakeTime);
  s.evaluateCurrentNight();
}

/** Run the scripted night(s), then route into the real morning/death flow. */
export function runDemoNight(kind: DemoPanelAction): void {
  if (!useGameStore.getState().game.demoMode) {
    return; // panel-only entry; never fires during normal play
  }
  if (!snapshot) {
    snapshot = takeSnapshot();
  }
  ensurePlayableState();
  if (kind === 'death') {
    for (let i = 0; i < MAX_DEATH_NIGHTS && useGameStore.getState().game.hp > 0; i += 1) {
      runOneNight('terrible');
    }
  } else {
    runOneNight(kind);
  }
  router.push(useGameStore.getState().game.hp === 0 ? '/death' : '/morning-scene');
}

/** [Reset]: restore the pre-demo snapshot byte-for-byte and go back Home. */
export function resetDemo(): void {
  if (snapshot) {
    useGameStore.setState({ ...snapshot, game: { ...snapshot.game, demoMode: true } });
    snapshot = null;
  }
  router.replace('/');
}
