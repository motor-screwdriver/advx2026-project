/**
 * Headless widget task handler, registered once from the app entry on Android
 * native builds. The launcher wakes our JS bundle (even with the app dead)
 * for every widget update, so state is re-read from the persisted store
 * snapshot via readWidgetData. The 2x1 toggle tap arrives as WIDGET_CLICK
 * (no app launch): the store itself performs the check-in — see sleepToggle.
 */
import React from 'react'
import { registerWidgetTaskHandler } from 'react-native-android-widget'

import { renderHomeWidgets } from './render'
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
        if (props.clickAction !== TOGGLE_SLEEP_ACTION) {
          break
        }
        const action = props.clickActionData?.action === 'wake' ? 'wake' : 'sleep'
        const data = await toggleSleepFromWidget(action)
        renderByName(props.widgetInfo.widgetName, data, render)
        await renderHomeWidgets(data) // the sibling widget mirrors the new state
        break
      }
      case 'WIDGET_DELETED':
        break
    }
  })
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
