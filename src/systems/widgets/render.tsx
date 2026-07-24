/**
 * Pushes fresh widget trees to the launcher from the live app process.
 * Loaded only behind the ./index guard (Android native build): importing
 * react-native-android-widget in Expo Go / web / jest would crash on the
 * missing native module. When no widget sits on the home screen,
 * requestWidgetUpdate is a cheap no-op.
 */
import React from 'react'
import { requestWidgetUpdate } from 'react-native-android-widget'

import type { HomeWidgetData } from './widgetData'
import { SleepStatsWidget, SleepToggleWidget, WIDGET_NAMES } from './widgets'

/** Redraws one widget — used by the click handler for the sibling widget
 *  (the tapped one is drawn via the handler's own renderWidget, so each
 *  widget gets exactly one draw per tap: no double-draw flicker). */
export async function renderHomeWidget(widgetName: string, data: HomeWidgetData): Promise<void> {
  await requestWidgetUpdate({
    widgetName,
    renderWidget: () =>
      widgetName === WIDGET_NAMES.toggle ? (
        <SleepToggleWidget data={data} />
      ) : (
        <SleepStatsWidget data={data} />
      ),
  })
}

export async function renderHomeWidgets(data: HomeWidgetData): Promise<void> {
  await renderHomeWidget(WIDGET_NAMES.stats, data)
  await renderHomeWidget(WIDGET_NAMES.toggle, data)
}
