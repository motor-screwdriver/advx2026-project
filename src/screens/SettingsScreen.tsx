import React, { useEffect, useRef, useState } from 'react'
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { DESIGN } from '../../assets/manifest'
import { getNotificationsEnabled, setNotificationsEnabled } from '../systems/notifications'
import { syncWakeReminder } from '../systems/wakeReminder'
import { SettingsHeader } from '../ui/SettingsHeader'
import { useScreenTransition } from '../ui/screenTransition'
import { SpriteRow, spriteColors, useSettingsScale } from '../ui/settingsSprite'
import { SpriteToggle } from '../ui/SpriteToggle'
import { strings } from '../ui/strings'
import { theme } from '../ui/theme'
import { useGame } from '../ui/useGame'
import { formatClock } from '../ui/window'
import { EinkRow, MiFitRow, RowValue } from './SettingsRows'

const DEMO_TAP_COUNT = 5
const DEMO_TAP_WINDOW_MS = 1500

/** Persisted notifications toggle (drives bedtime/wake/morning reminders). */
function useNotificationsToggle(): [boolean, () => void] {
  const [on, setOn] = useState(true)
  useEffect(() => {
    void getNotificationsEnabled().then(setOn)
  }, [])
  const toggle = () => {
    const next = !on
    setOn(next)
    void setNotificationsEnabled(next).then(syncWakeReminder)
  }
  return [on, toggle]
}

/** Hidden demo toggle: 5 quick taps on the version footer. */
function useVersionTap(toggleDemoMode: () => void): () => void {
  const taps = useRef<number[]>([])
  return () => {
    const now = Date.now()
    taps.current = [...taps.current.filter((t) => now - t < DEMO_TAP_WINDOW_MS), now]
    if (taps.current.length >= DEMO_TAP_COUNT) {
      taps.current = []
      toggleDemoMode()
    }
  }
}

/** "RESET ALL PROGRESS?" confirm dialog for the red reset row. */
function confirmReset(onConfirm: () => void): void {
  Alert.alert(strings.settings_reset, strings.settings_reset_confirm, [
    { text: strings.common_cancel, style: 'cancel' },
    { text: strings.common_confirm, style: 'destructive', onPress: onConfirm },
  ])
}

/** VERSION 0.1.0 slice; swaps to the demo caption when demo mode is on. */
function VersionFooter({ k, demo, onTap }: { k: number; demo: boolean; onTap: () => void }) {
  const entry = DESIGN.settings_version
  return (
    <Pressable onPress={onTap} style={[styles.versionBox, { marginTop: 232 * k }]} hitSlop={16}>
      {demo ? (
        <Text style={[styles.demoText, { fontSize: 64 * k }]}>{strings.settings_demo_on}</Text>
      ) : (
        <Image
          source={entry.source}
          style={{ width: entry.width * k, height: entry.height * k }}
          resizeMode="stretch"
        />
      )}
    </Pressable>
  )
}

/**
 * Settings screen assembled 1:1 from slices of assets/settings/settings.png:
 * gold SETTINGS header, riveted plank rows (sleep window, notifications
 * toggle, Mi Fit account, e-ink device, change window, reset progress) and
 * the version footer — all the actual sprite pixels, with dynamic overlays.
 */
export function SettingsScreen() {
  const go = useScreenTransition()
  const { state, resetProgress, toggleDemoMode } = useGame()
  const { k, rowW, pad } = useSettingsScale()
  const [notificationsOn, toggleNotifications] = useNotificationsToggle()
  const versionTap = useVersionTap(toggleDemoMode)

  const reset = () =>
    confirmReset(() => {
      resetProgress()
      go('/oracle', { replace: true })
    })

  const window = state.window
  const windowText = window
    ? `${formatClock(window.bedMin)} - ${formatClock(window.wakeMin)}`
    : '--:--'
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={[styles.body, { paddingHorizontal: pad, gap: 90 * k }]}
        showsVerticalScrollIndicator={false}
      >
        <SettingsHeader k={k} />
        <View style={{ height: 58 * k }} />
        <SpriteRow entry={DESIGN.settings_row_window} k={k} delay={80}>
          <RowValue text={windowText} k={k} right={158} size={96} />
        </SpriteRow>
        <SpriteRow entry={DESIGN.settings_row_notif} k={k} delay={160}>
          <SpriteToggle on={notificationsOn} onToggle={toggleNotifications} k={k} />
        </SpriteRow>
        <MiFitRow k={k} rowW={rowW} delay={240} />
        <EinkRow k={k} rowW={rowW} delay={320} />
        <SpriteRow
          entry={DESIGN.settings_row_change}
          k={k}
          onPress={() => go('/onboarding', { params: { mode: 'change' } })}
          delay={400}
        />
        <SpriteRow entry={DESIGN.settings_row_reset} k={k} onPress={reset} delay={480} />
        <VersionFooter k={k} demo={state.demoMode} onTap={versionTap} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: spriteColors.bg,
  },
  body: {
    paddingTop: theme.spacing(6),
    paddingBottom: theme.spacing(10),
    alignItems: 'center',
  },
  versionBox: {
    alignItems: 'center',
  },
  demoText: {
    fontFamily: theme.fontFamily,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: spriteColors.tan,
  },
})
