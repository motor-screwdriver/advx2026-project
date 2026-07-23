/**
 * Systems bootstrap. One call from the GameProvider seam (src/ui/useGame.tsx)
 * wires every OS/device integration to the store:
 * - notifications re-sync on app open, window change and every night result;
 * - e-ink pushes (debounced 5 s) fire on game events and equips;
 * - SystemsLayer mounts the floating demo panel + off-screen e-ink card.
 * All integrations degrade silently — solo offline play never depends on them.
 */
import React from 'react'
import { AppState } from 'react-native'

import { FLAGS } from '../contracts/flags'
import { todayDate } from '../engine/time'
import { useGameStore, type GameStore } from '../state/store'
import { DemoPanel } from './DemoPanel'
import { scheduleEinkPush } from './eink'
import { EinkCardHost } from './einkCard'
import { configureNotificationHandler, syncNotifications } from './notifications'

let initialized = false

export function initSystems(): void {
  if (initialized) {
    return
  }
  initialized = true
  configureNotificationHandler()
  void resyncNotifications()
  useGameStore.subscribe(onStoreChange)
  // Re-arm the schedule when the user comes back (morning summary re-arms).
  AppState.addEventListener('change', (status) => {
    if (status === 'active') {
      void resyncNotifications()
    }
  })
}

function onStoreChange(state: GameStore, prev: GameStore): void {
  const g = state.game
  const p = prev.game
  if (g.window !== p.window || g.nights !== p.nights) {
    void resyncNotifications()
  }
  const lastEvent = state.events[state.events.length - 1]
  const prevLastEvent = prev.events[prev.events.length - 1]
  // Push whenever any field shown on the Dot widgets changes: hero (sprite/
  // name/level), hp (hearts), streak (+ next-lvl), nights (last-night/rate),
  // or equipped cosmetics.
  const cardChanged =
    g.hero !== p.hero ||
    g.hp !== p.hp ||
    g.perfectWeekStreak !== p.perfectWeekStreak ||
    g.nights !== p.nights ||
    g.equipped !== p.equipped
  if (lastEvent !== prevLastEvent || cardChanged) {
    scheduleEinkPush(g)
  }
}

async function resyncNotifications(): Promise<void> {
  const { game } = useGameStore.getState()
  const last = game.nights[game.nights.length - 1]
  const checkedInToday = last?.date === todayDate() && last.wakeTime !== null
  await syncNotifications(game.window, checkedInToday)
}

/** Mounted once inside GameProvider: floating demo UI + off-screen e-ink card. */
export function SystemsLayer() {
  return (
    <>
      <DemoPanel />
      {FLAGS.eink && <EinkCardHost />}
    </>
  )
}
