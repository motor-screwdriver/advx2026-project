import React, { useEffect, useRef, useState } from 'react'
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'

import { FLAGS } from '../contracts/flags'
import type { SleepWindow } from '../contracts/types'
import { getNotificationsEnabled, setNotificationsEnabled } from '../systems/notifications'
import { syncWakeReminder } from '../systems/wakeReminder'
import { PixelButton } from '../ui/PixelButton'
import { PixelPanel } from '../ui/PixelPanel'
import { Screen } from '../ui/Screen'
import { useScreenTransition } from '../ui/screenTransition'
import { strings } from '../ui/strings'
import { theme } from '../ui/theme'
import { useGame } from '../ui/useGame'
import { formatClock } from '../ui/window'
import { MiFitnessPanel } from './MiFitnessPanel'

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

export function SettingsScreen() {
  const go = useScreenTransition()
  const { state, resetProgress, toggleDemoMode } = useGame()
  const [notificationsOn, toggleNotifications] = useNotificationsToggle()
  const taps = useRef<number[]>([])

  const confirmReset = () =>
    Alert.alert(strings.settings_reset, strings.settings_reset_confirm, [
      { text: strings.common_cancel, style: 'cancel' },
      {
        text: strings.common_confirm,
        style: 'destructive',
        onPress: () => {
          resetProgress()
          go('/oracle', { replace: true })
        },
      },
    ])

  const versionTap = () => {
    const now = Date.now()
    taps.current = [...taps.current.filter((t) => now - t < DEMO_TAP_WINDOW_MS), now]
    if (taps.current.length >= DEMO_TAP_COUNT) {
      taps.current = []
      toggleDemoMode()
    }
  }

  return (
    <Screen title={strings.settings_title} scroll>
      <WindowPanel
        window={state.window}
        onChange={() => go('/onboarding', { params: { mode: 'change' } })}
      />
      <PixelPanel>
        <View style={styles.row}>
          <Text style={styles.label}>{strings.settings_notifications}</Text>
          <PixelButton
            compact
            label={notificationsOn ? strings.settings_on : strings.settings_off}
            onPress={toggleNotifications}
          />
        </View>
      </PixelPanel>
      <MiFitnessPanel />
      {FLAGS.eink && <EinkPanel />}
      <PixelButton label={strings.settings_reset} onPress={confirmReset} />
      <Pressable onPress={versionTap}>
        <Text style={styles.version}>
          {state.demoMode ? strings.settings_demo_on : strings.settings_version}
        </Text>
      </Pressable>
    </Screen>
  )
}

function WindowPanel({ window, onChange }: { window: SleepWindow | null; onChange: () => void }) {
  return (
    <PixelPanel>
      <Text style={styles.label}>{strings.settings_window}</Text>
      <Text style={styles.value}>
        {window ? `${formatClock(window.bedMin)} - ${formatClock(window.wakeMin)}` : '-'}
      </Text>
      <PixelButton compact label={strings.settings_change} onPress={onChange} />
    </PixelPanel>
  )
}

function EinkPanel() {
  const { customizeWidgets, scanDeviceId } = useGame()
  const [deviceId, setDeviceId] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [scanning, setScanning] = useState(false)
  const scan = async () => {
    setScanning(true)
    try {
      const id = await scanDeviceId()
      if (id) {
        setDeviceId(id)
      }
    } finally {
      setScanning(false)
    }
  }
  return (
    <PixelPanel>
      <Text style={styles.label}>{strings.settings_eink}</Text>
      <PixelButton
        compact
        label={scanning ? strings.settings_scanning : strings.settings_scan_nfc}
        onPress={() => void scan()}
        disabled={scanning}
      />
      <Text style={styles.hint}>{strings.settings_device_id_hint}</Text>
      <TextInput
        style={styles.input}
        placeholder={strings.settings_device_id}
        placeholderTextColor={theme.colors.textDim}
        value={deviceId}
        onChangeText={setDeviceId}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TextInput
        style={styles.input}
        placeholder={strings.settings_api_key}
        placeholderTextColor={theme.colors.textDim}
        value={apiKey}
        onChangeText={setApiKey}
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry
      />
      <Text style={styles.hint}>{strings.settings_api_key_hint}</Text>
      <PixelButton
        compact
        label={strings.settings_customize}
        onPress={() => customizeWidgets(deviceId, apiKey)}
      />
    </PixelPanel>
  )
}

const styles = StyleSheet.create({
  label: {
    ...theme.type.label,
    color: theme.colors.textDim,
    textTransform: 'uppercase',
  },
  value: {
    ...theme.type.body,
    color: theme.colors.text,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  input: {
    ...theme.type.body,
    color: theme.colors.text,
    backgroundColor: theme.colors.inset,
    borderWidth: theme.borderWidth,
    borderColor: theme.colors.outline,
    borderRadius: theme.borderRadius,
    padding: theme.spacing(3),
  },
  hint: {
    ...theme.type.label,
    color: theme.colors.textDim,
    textTransform: 'none',
  },
  version: {
    ...theme.type.label,
    color: theme.colors.textDim,
    textAlign: 'center',
  },
})
