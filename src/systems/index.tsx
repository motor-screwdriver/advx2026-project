/**
 * Systems bootstrap. One call from the GameProvider seam (src/ui/useGame.tsx)
 * wires every OS/device integration to the store:
 * - notifications re-sync on app open, window change and every night result;
 * - e-ink pushes (debounced 5 s) fire on game events and equips;
 * - SystemsLayer mounts the floating demo panel + off-screen e-ink card.
 * All integrations degrade silently — solo offline play never depends on them.
 */
import React from 'react';
import { AppState } from 'react-native';

import { FLAGS } from '../contracts/flags';
import { todayDate } from '../engine/time';
import { useGameStore, type GameStore } from '../state/store';
import { DemoPanel } from './DemoPanel';
import { scheduleEinkPush } from './eink';
import { EinkCardHost } from './einkCard';
import { configureNotificationHandler, syncNotifications } from './notifications';

let initialized = false;

export function initSystems(): void {
  if (initialized) {
    return;
  }
  initialized = true;
  configureNotificationHandler();
  void resyncNotifications();
  useGameStore.subscribe(onStoreChange);
  // Re-arm the schedule when the user comes back (morning summary re-arms).
  AppState.addEventListener('change', (status) => {
    if (status === 'active') {
      void resyncNotifications();
    }
  });
}

function onStoreChange(state: GameStore, prev: GameStore): void {
  if (state.game.window !== prev.game.window || state.game.nights !== prev.game.nights) {
    void resyncNotifications();
  }
  const lastEvent = state.events[state.events.length - 1];
  const prevLastEvent = prev.events[prev.events.length - 1];
  if (lastEvent !== prevLastEvent || state.game.equipped !== prev.game.equipped) {
    scheduleEinkPush(state.game);
  }
}

async function resyncNotifications(): Promise<void> {
  const { game } = useGameStore.getState();
  const last = game.nights[game.nights.length - 1];
  const checkedInToday = last?.date === todayDate() && last.wakeTime !== null;
  await syncNotifications(game.window, checkedInToday);
}

/** Mounted once inside GameProvider: floating demo UI + off-screen e-ink card. */
export function SystemsLayer() {
  return (
    <>
      <DemoPanel />
      {FLAGS.eink && <EinkCardHost />}
    </>
  );
}
