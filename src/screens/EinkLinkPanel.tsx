import React, { useState } from 'react'
import { StyleSheet, Text, TextInput } from 'react-native'

import {
  SettingsDropdownPanel,
  SettingsSpriteButton,
  settingsHintStyle,
  settingsInputStyle,
} from '../ui/settingsDropdown'
import { spriteColors } from '../ui/settingsSprite'
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
      <SettingsSpriteButton
        k={k}
        label={link.scanning ? strings.settings_scanning : strings.settings_scan_nfc}
        onPress={() => void link.scan()}
        disabled={link.scanning}
      />
      <Text style={[styles.hint, settingsHintStyle(k)]}>{strings.settings_device_id_hint}</Text>
      <TextInput
        style={[styles.input, settingsInputStyle(k)]}
        placeholder={strings.settings_device_id}
        placeholderTextColor={spriteColors.tan}
        value={link.deviceId}
        onChangeText={link.setDeviceId}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TextInput
        style={[styles.input, settingsInputStyle(k)]}
        placeholder={strings.settings_api_key}
        placeholderTextColor={spriteColors.tan}
        value={link.apiKey}
        onChangeText={link.setApiKey}
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry
      />
      <Text style={[styles.hint, settingsHintStyle(k)]}>{strings.settings_api_key_hint}</Text>
      <SettingsSpriteButton k={k} label={strings.settings_customize} onPress={link.customize} />
    </SettingsDropdownPanel>
  )
}

const styles = StyleSheet.create({
  input: {
    fontFamily: theme.fontFamily,
    color: spriteColors.cream,
    backgroundColor: spriteColors.trackWell,
    borderWidth: 3,
    borderColor: spriteColors.outline,
    borderRadius: 4,
  },
  hint: {
    fontFamily: theme.fontFamily,
    color: spriteColors.tan,
  },
})
