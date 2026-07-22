import React, { createContext, useContext, useMemo, useState } from 'react';

import { assignHero, applyNightResult, evaluateNight, mockGameState } from '../contracts/mock';
import type {
  ArtifactId,
  ChestLoot,
  GameState,
  NightEvaluation,
  SleepWindow,
} from '../contracts/types';
import { nowNightLine } from './window';

export type DebugPreset = 'empty' | 'mid' | 'death';

const RESURRECTION_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

const ARTIFACT_POOL: ArtifactId[] = [
  'iron_armor',
  'phoenix_feather',
  'hourglass',
  'coffee_amulet',
  'alarm_bell',
  'warm_blanket',
  'night_watch',
  'lucky_coin',
  'star_map',
  'second_wind',
];

interface GameApi {
  state: GameState;
  lastEvaluation: NightEvaluation | null;
  pendingBedTime: number | null;
  completeOnboarding: (window: SleepWindow) => void;
  sleepNow: () => void;
  wakeNow: () => NightEvaluation;
  canResurrect: () => boolean;
  resurrect: () => void;
  startNewHero: () => void;
  openChest: () => ChestLoot;
  equip: (slot: 'armor' | 'charm', artifact: ArtifactId) => void;
  changeWindow: (window: SleepWindow) => void;
  resetProgress: () => void;
  toggleDemoMode: () => void;
  sendTestCard: (deviceId: string, apiKey: string) => void;
  loadDebugPreset: (preset: DebugPreset) => void;
}

const GameContext = createContext<GameApi | null>(null);

function emptyState(): GameState {
  return {
    window: null,
    hero: null,
    hp: 7,
    perfectWeekStreak: 0,
    nights: [],
    artifacts: [],
    equipped: { armor: null, charm: null },
    lastResurrectionAt: null,
    onboardingDone: false,
    demoMode: false,
  };
}

function heroName(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

/** Fresh hero for a window; HP full, streak 0, inventory cleared. */
function summonState(window: SleepWindow, previous?: GameState): GameState {
  const type = assignHero(window);
  return {
    window,
    hero: { type, name: heroName(type), level: 1, xp: 0 },
    hp: 7,
    perfectWeekStreak: 0,
    nights: previous?.nights ?? [],
    artifacts: [],
    equipped: { armor: null, charm: null },
    lastResurrectionAt: previous?.lastResurrectionAt ?? null,
    onboardingDone: true,
    demoMode: previous?.demoMode ?? false,
  };
}

function rollLoot(): ChestLoot {
  const roll = Math.random();
  if (roll < 0.7) {
    return { rarity: 'common', artifactId: null, cosmeticId: 'cosmetic_ember' };
  }
  if (roll < 0.95) {
    const artifactId = ARTIFACT_POOL[Math.floor(Math.random() * ARTIFACT_POOL.length)];
    return { rarity: 'rare', artifactId, cosmeticId: null };
  }
  return { rarity: 'epic', artifactId: null, cosmeticId: 'cosmetic_gold' };
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GameState>(emptyState);
  const [lastEvaluation, setLastEvaluation] = useState<NightEvaluation | null>(null);
  const [pendingBedTime, setPendingBedTime] = useState<number | null>(null);

  const api = useMemo<GameApi>(
    () => ({
      state,
      lastEvaluation,
      pendingBedTime,
      completeOnboarding: (window) => setState(summonState(window)),
      sleepNow: () => setPendingBedTime(nowNightLine()),
      wakeNow: () => {
        const evaluation = evaluateNight(state, pendingBedTime, nowNightLine());
        setState((current) => applyNightResult(current, evaluation));
        setLastEvaluation(evaluation);
        setPendingBedTime(null);
        return evaluation;
      },
      canResurrect: () =>
        !state.lastResurrectionAt ||
        Date.now() - new Date(state.lastResurrectionAt).getTime() >= RESURRECTION_COOLDOWN_MS,
      resurrect: () =>
        setState((s) => ({ ...s, hp: 3, lastResurrectionAt: new Date().toISOString() })),
      startNewHero: () => setState((s) => (s.window ? summonState(s.window, s) : emptyState())),
      openChest: () => {
        const loot = rollLoot();
        if (loot.artifactId) {
          setState((s) => ({ ...s, artifacts: [...s.artifacts, loot.artifactId!] }));
        }
        return loot;
      },
      equip: (slot, artifact) =>
        setState((s) =>
          s.artifacts.includes(artifact) ? { ...s, equipped: { ...s.equipped, [slot]: artifact } } : s,
        ),
      changeWindow: (window) =>
        setState((s) => ({ ...summonState(window, s), hp: s.hp })),
      resetProgress: () => {
        setState(emptyState());
        setLastEvaluation(null);
        setPendingBedTime(null);
      },
      toggleDemoMode: () => setState((s) => ({ ...s, demoMode: !s.demoMode })),
      // Dev D wires the real e-ink push; keep the callback shape stable.
      sendTestCard: (deviceId, apiKey) => console.log('[eink] test card', deviceId, apiKey),
      loadDebugPreset: (preset) => {
        if (preset === 'empty') setState(emptyState());
        if (preset === 'mid') setState(mockGameState());
        if (preset === 'death') setState({ ...mockGameState(), hp: 0 });
      },
    }),
    [state, lastEvaluation, pendingBedTime],
  );

  return <GameContext.Provider value={api}>{children}</GameContext.Provider>;
}

export function useGame(): GameApi {
  const api = useContext(GameContext);
  if (!api) {
    throw new Error('useGame must be used inside <GameProvider>');
  }
  return api;
}
