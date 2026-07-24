/**
 * Headless widget task handler, registered once from the app entry on Android
 * native builds. The launcher wakes our JS bundle (even with the app dead)
 * for every widget update, so state is re-read from the persisted store
 * snapshot via readWidgetData. The 2x1 toggle tap arrives as WIDGET_CLICK
 * (no app launch): the store itself performs the check-in — see sleepToggle.
 * Every tap draws each widget exactly once (live context: the store
 * subscription; cold context: this handler) — double draws visibly flicker.
 */
import React from 'react'
import { registerWidgetTaskHandler } from 'react-native-android-widget'

import { widgetLiveSyncArmed } from './liveSync'
import { renderHomeWidget } from './render'
import { toggleSleepFromWidget } from './sleepToggle'
import { readWidgetData, type HomeWidgetData } from './widgetData'
import { SleepStatsWidget, SleepToggleWidget, TOGGLE_SLEEP_ACTION, WIDGET_NAMES } from './widgets'

let registered = false

type RenderFn = (widget: React.JSX.Element) => void

export function registerHomeWidgetTaskHandler(): void {
  if (registered) {
    return
  }
  registered = true
  registerWidgetTaskHandler(async (props) => {
    const render: RenderFn = (widget) => props.renderWidget(widget)
    switch (props.widgetAction) {
      case 'WIDGET_ADDED':
      case 'WIDGET_UPDATE':
      case 'WIDGET_RESIZED': {
        renderByName(props.widgetInfo.widgetName, await readWidgetData(), render)
        break
      }
      case 'WIDGET_CLICK': {
        if (props.clickAction !== TOGGLE_SLEEP_ACTION || debouncing()) {
          break
        }
        const action = props.clickActionData?.action === 'wake' ? 'wake' : 'sleep'
        const data = await toggleSleepFromWidget(action)
        if (widgetLiveSyncArmed()) {
          break // live app: the store subscription redraws both widgets once
        }
        renderByName(props.widgetInfo.widgetName, data, render)
        await renderHomeWidget(siblingOf(props.widgetInfo.widgetName), data)
        break
      }
      case 'WIDGET_DELETED':
        break
    }
  })
}

let lastClickAt = 0

/** Launchers occasionally deliver one tap twice; absorb repeats within 700 ms. */
function debouncing(): boolean {
  const now = Date.now()
  const repeat = now - lastClickAt < 700
  lastClickAt = now
  return repeat
}

function siblingOf(widgetName: string): string {
  return widgetName === WIDGET_NAMES.toggle ? WIDGET_NAMES.stats : WIDGET_NAMES.toggle
}

function renderByName(widgetName: string, data: HomeWidgetData, render: RenderFn): void {
  render(
    widgetName === WIDGET_NAMES.toggle ? (
      <SleepToggleWidget data={data} />
    ) : (
      <SleepStatsWidget data={data} />
    ),
  )
}
