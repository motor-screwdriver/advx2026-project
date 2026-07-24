/**
 * Headless sleep toggle behind the 2x1 widget. Runs inside the widget task
 * handler: when the app process is alive the headless task shares its JS
 * context (one live store, UI updates in place); when the launcher woke a
 * cold context the store rehydrates from the AsyncStorage snapshot first.
 * Either way the zustand store stays the single writer — the persisted JSON
 * is never hand-edited, so the app picks the change up on next foreground.
 */
import { useGameStore } from '../../state/store'
import { buildWidgetData, readWidgetData, type HomeWidgetData } from './widgetData'

export type SleepToggleAction = 'sleep' | 'wake'

/**
 * Apply the tap to the real store and return fresh widget data. A tap that
 * no longer matches the state (widget rendered before another change) is a
 * no-op — the caller just re-renders the current state.
 */
export async function toggleSleepFromWidget(action: SleepToggleAction): Promise<HomeWidgetData> {
  try {
    await useGameStore.persist.rehydrate()
    const state = useGameStore.getState()
    const asleep = state.pendingBedTime !== null
    if (action === 'sleep' && !asleep) {
      state.checkIn('bed')
    } else if (action === 'wake' && asleep) {
      state.checkIn('wake')
      state.evaluateCurrentNight()
    }
    const next = useGameStore.getState()
    return buildWidgetData(next.game, next.pendingBedTime)
  } catch (error) {
    console.log('[widgets] sleep toggle failed (silent):', error)
    return readWidgetData()
  }
}
