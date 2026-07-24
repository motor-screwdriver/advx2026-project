/**
 * Headless widget task handler, registered once from the app entry on Android
 * native builds. The launcher wakes our JS bundle (even with the app dead)
 * for every widget update, so state is re-read from the persisted store
 * snapshot via readWidgetData. Taps use OPEN_URI deep links handled by the
 * app router — no WIDGET_CLICK work happens here (the store has a single
 * writer: the app process).
 */
import React from 'react'
import { registerWidgetTaskHandler } from 'react-native-android-widget'

import { readWidgetData } from './widgetData'
import { SleepStatsWidget, SleepToggleWidget, WIDGET_NAMES } from './widgets'

let registered = false

export function registerHomeWidgetTaskHandler(): void {
  if (registered) {
    return
  }
  registered = true
  registerWidgetTaskHandler(async (props) => {
    switch (props.widgetAction) {
      case 'WIDGET_ADDED':
      case 'WIDGET_UPDATE':
      case 'WIDGET_RESIZED': {
        const data = await readWidgetData()
        props.renderWidget(
          props.widgetInfo.widgetName === WIDGET_NAMES.toggle ? (
            <SleepToggleWidget data={data} />
          ) : (
            <SleepStatsWidget data={data} />
          ),
        )
        break
      }
      case 'WIDGET_DELETED':
      case 'WIDGET_CLICK':
        break
    }
  })
}
