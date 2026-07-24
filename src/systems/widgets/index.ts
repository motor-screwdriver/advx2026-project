/**
 * Android home-screen widgets facade. The widget native module is
 * lazy-required behind the same guard as nfc/notifications: in Expo Go, on
 * web and in jest every call no-ops, so solo play and tests never touch the
 * native bridge. Import from this module only — never from ./register,
 * ./render or ./widgets directly (they pull in the native widget library).
 */
import { isRunningInExpoGo } from 'expo'
import { Platform } from 'react-native'

import type { HomeWidgetData } from './widgetData'

export { buildWidgetData, readWidgetData } from './widgetData'
export type { HomeWidgetData } from './widgetData'

function widgetsSupported(): boolean {
  return Platform.OS === 'android' && !isRunningInExpoGo()
}

/** Called once from the app entry: registers the headless render task. */
export function initHomeWidgets(): void {
  if (!widgetsSupported()) {
    return
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('./register') as typeof import('./register')
    mod.registerHomeWidgetTaskHandler()
  } catch (error) {
    console.log('[widgets] task handler registration failed (silent):', error)
  }
}

/** Pushes live state to both widgets after game actions (native builds only). */
export async function syncHomeWidgets(data: HomeWidgetData): Promise<void> {
  if (!widgetsSupported()) {
    return
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('./render') as typeof import('./render')
    await mod.renderHomeWidgets(data)
  } catch (error) {
    console.log('[widgets] update failed (silent):', error)
  }
}
