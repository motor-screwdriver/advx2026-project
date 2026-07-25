import React, { useState } from 'react'
import { StyleSheet, Text, TextInput } from 'react-native'

import { SettingsDropdownPanel, spriteColors } from '../ui/settingsSprite'
import { strings } from '../ui/strings'
import { theme } from '../ui/theme'
import { useGame } from '../ui/useGame'

/**
 * E-ink device link form, opened by tapping the "E-INK DEVICE" plank row.
 * Same functionality as the old EinkPanel (NFC scan, device id, API key,
 * customize) restyled to the settings sprite's wooden plank language.
 */

/** Scan / link state and handlers, split out for the 60-line function cap. */
function useEinkLink(onLinked: () => void) {
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

  const customize = () => {
    customizeWidgets(deviceId, apiKey)
    if (deviceId.trim().length > 0) {
      onLinked()
    }
  }

  return { deviceId, setDeviceId, apiKey, setApiKey, scanning, scan, customize }
}

export function EinkLinkPanel({ k, onLinked }: { k: number; onLinked: () => void }) {
  const link = useEinkLink(onLinked)

  return (
    <SettingsDropdownPanel k={k}>
      <PlankAction
        label={link.scanning ? strings.settings_scanning : strings.settings_scan_nfc}
        onPress={() => void link.scan()}
        disabled={link.scanning}
      />
      <Text style={styles.hint}>{strings.settings_device_id_hint}</Text>
      <TextInput
        style={styles.input}
        placeholder={strings.settings_device_id}
        placeholderTextColor={spriteColors.tan}
        value={link.deviceId}
        onChangeText={link.setDeviceId}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TextInput
        style={styles.input}
        placeholder={strings.settings_api_key}
        placeholderTextColor={spriteColors.tan}
        value={link.apiKey}
        onChangeText={link.setApiKey}
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry
      />
      <Text style={styles.hint}>{strings.settings_api_key_hint}</Text>
      <PlankAction label={strings.settings_customize} onPress={link.customize} />
    </SettingsDropdownPanel>
  )
}

/** Small gold action chip in the sprite's toggle-knob style. */
function PlankAction({
  label,
  onPress,
  disabled = false,
}: {
  label: string
  onPress: () => void
  disabled?: boolean
}) {
  return (
    <Text
      accessibilityRole="button"
      onPress={disabled ? undefined : onPress}
      style={[styles.action, disabled && styles.actionDisabled]}
    >
      {label}
    </Text>
  )
}

const styles = StyleSheet.create({
  action: {
    fontFamily: theme.fontFamily,
    fontSize: 13,
    lineHeight: 17,
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign: 'center',
    color: spriteColors.inkOnGold,
    backgroundColor: spriteColors.gold,
    borderRadius: 14,
    borderTopColor: spriteColors.goldLight,
    borderTopWidth: 2,
    borderBottomColor: spriteColors.goldDark,
    borderBottomWidth: 2,
    paddingVertical: theme.spacing(2),
    paddingHorizontal: theme.spacing(4),
    overflow: 'hidden',
  },
  actionDisabled: {
    opacity: 0.5,
  },
  input: {
    fontFamily: theme.fontFamily,
    fontSize: 14,
    lineHeight: 18,
    color: spriteColors.cream,
    backgroundColor: spriteColors.trackWell,
    borderWidth: 2,
    borderColor: spriteColors.outline,
    borderRadius: 6,
    padding: theme.spacing(3),
  },
  hint: {
    fontFamily: theme.fontFamily,
    fontSize: 11,
    lineHeight: 15,
    color: spriteColors.tan,
  },
})
