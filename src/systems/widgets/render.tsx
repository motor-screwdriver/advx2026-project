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

export async function renderHomeWidgets(data: HomeWidgetData): Promise<void> {
  await requestWidgetUpdate({
    widgetName: WIDGET_NAMES.stats,
    renderWidget: () => <SleepStatsWidget data={data} />,
  })
  await requestWidgetUpdate({
    widgetName: WIDGET_NAMES.toggle,
    renderWidget: () => <SleepToggleWidget data={data} />,
  })
}
