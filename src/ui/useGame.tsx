/**
 * Game data hook. The API shape is unchanged from M0 (screens are built
 * against it), but the internals are swapped from the contracts mock to the
 * real engine store in src/state — per PROMPT A this swap is the engine
 * developer's job and must not touch the screens.
 *
 * One deliberate difference: `openChest()` returns null when no chest was
 * earned (Perfect Week), where the mock always rolled loot. ChestScreen
 * already handles a null loot state.
 */
import React, { createContext, useContext, useMemo } from 'react';

import { mockGameState } from '../contracts/mock';
import type {
  ArtifactId,
  ChestLoot,
  GameState,
  NightEvaluation,
  SleepWindow,
} from '../contracts/types';
import { useGameStore } from '../state/store';
import type { EngineMeta } from '../state/store';
// Dev D seam: systems bootstrap + real e-ink push (src/systems).
import { initSystems, SystemsLayer } from '../systems';
import { sendTestCard as sendEinkTestCard } from '../systems/eink';

export type DebugPreset = 'empty' | 'mid' | 'death';

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
  openChest: () => ChestLoot | null;
  equip: (slot: 'armor' | 'charm', artifact: ArtifactId) => void;
  changeWindow: (window: SleepWindow) => void;
  resetProgress: () => void;
  toggleDemoMode: () => void;
  sendTestCard: (deviceId: string, apiKey: string) => void;
  loadDebugPreset: (preset: DebugPreset) => void;
}

const GameContext = createContext<GameApi | null>(null);

const EMPTY_META: EngineMeta = {
  windowChangedAt: null,
  secondWindUsedAt: null,
};

export function GameProvider({ children }: { children: React.ReactNode }) {
  const game = useGameStore((s) => s.game);
  const lastEvaluation = useGameStore((s) => s.lastEvaluation);
  const pendingBedTime = useGameStore((s) => s.pendingBedTime);
  const hydrated = useGameStore((s) => s.hydrated);
  React.useEffect(() => {
    initSystems(); // Dev D: notifications, demo panel wiring, e-ink triggers
  }, []);
  const api = useMemo<GameApi>(
    () => buildApi(game, lastEvaluation, pendingBedTime),
    [game, lastEvaluation, pendingBedTime],
  );
  if (!hydrated) {
    return null; // wait for AsyncStorage rehydration, avoid an onboarding flash
  }
  return (
    <GameContext.Provider value={api}>
      {children}
      <SystemsLayer />
    </GameContext.Provider>
  );
}

function buildApi(
  game: GameState,
  lastEvaluation: NightEvaluation | null,
  pendingBedTime: number | null,
): GameApi {
  return {
    state: game,
    lastEvaluation,
    pendingBedTime,
    completeOnboarding: (window) => {
      useGameStore.getState().setWindow(window);
      useGameStore.getState().assignHeroForWindow();
    },
    sleepNow: () => useGameStore.getState().checkIn('bed'),
    wakeNow: () => {
      useGameStore.getState().checkIn('wake');
      return useGameStore.getState().evaluateCurrentNight();
    },
    canResurrect: () => useGameStore.getState().canResurrect(),
    resurrect: () => useGameStore.getState().applyResurrection(true),
    startNewHero: () => useGameStore.getState().startNewHero(),
    openChest: () => useGameStore.getState().openChest(),
    equip: (slot, artifact) => useGameStore.getState().equip(slot, artifact),
    changeWindow: (window) => {
      useGameStore.getState().changeWindow(window);
    },
    resetProgress: () => useGameStore.getState().reset(),
    toggleDemoMode: () => useGameStore.getState().toggleDemoMode(),
    // Dev D: real Dot e-ink push (silently no-ops while FLAGS.eink is off).
    sendTestCard: (deviceId, apiKey) => {
      void sendEinkTestCard(deviceId, apiKey);
    },
    loadDebugPreset,
  };
}

/** Dev presets for screen work: real GameState shapes through the real store. */
function loadDebugPreset(preset: DebugPreset): void {
  if (preset === 'empty') {
    useGameStore.getState().reset();
  }
  if (preset === 'mid') {
    // pendingChest so the Chest screen has something to open.
    useGameStore.setState({ game: mockGameState(), meta: EMPTY_META, pendingChest: true });
  }
  if (preset === 'death') {
    useGameStore.setState({ game: { ...mockGameState(), hp: 0 }, meta: EMPTY_META });
  }
}

export function useGame(): GameApi {
  const api = useContext(GameContext);
  if (!api) {
    throw new Error('useGame must be used inside <GameProvider>');
  }
  return api;
}
