import React from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'

import { MIFIT_REGIONS, type MiFitnessRegion } from '../contracts/mifit'
import type { MiFitnessLoginPhase } from '../ui/mifitLoginFlow'
import {
  SettingsSpriteButton,
  settingsHintStyle,
  settingsInputStyle,
  settingsOptionStyle,
  settingsValueStyle,
} from '../ui/settingsDropdown'
import { spriteColors } from '../ui/settingsSprite'
import { strings } from '../ui/strings'
import { theme } from '../ui/theme'

const REGION_LABELS: Record<MiFitnessRegion, string> = {
  de: strings.mifit_region_de,
  cn: strings.mifit_region_cn,
  ru: strings.mifit_region_ru,
  i2: strings.mifit_region_i2,
  sg: strings.mifit_region_sg,
  us: strings.mifit_region_us,
}

interface ConnectedStateProps {
  k: number
  region: MiFitnessRegion | null
  savedAt: string | null
  onDisconnect: () => void
}

interface DisconnectedStateProps {
  k: number
  phase: MiFitnessLoginPhase
  error: string | null
  region: MiFitnessRegion | null
  username: string
  password: string
  code: string
  openForm: () => void
  setRegion: (region: MiFitnessRegion) => void
  setUsername: (value: string) => void
  setPassword: (value: string) => void
  setCode: (value: string) => void
  connect: () => void
  verify: () => void
}

export function ConnectedState({ k, region, savedAt, onDisconnect }: ConnectedStateProps) {
  return (
    <View style={panelStyles.block}>
      <Text style={[panelStyles.value, settingsValueStyle(k)]}>{strings.mifit_connected}</Text>
      <Text style={[panelStyles.hint, settingsHintStyle(k)]}>
        {region ? `${strings.mifit_region}: ${region}` : ''}
      </Text>
      <Text style={[panelStyles.hint, settingsHintStyle(k)]}>
        {savedAt ? strings.mifit_saved_device : ''}
      </Text>
      <SettingsSpriteButton k={k} label={strings.mifit_disconnect} onPress={onDisconnect} danger />
    </View>
  )
}

export function DisconnectedState(props: DisconnectedStateProps) {
  if (props.phase === 'idle') {
    return <SettingsSpriteButton k={props.k} label={strings.mifit_login} onPress={props.openForm} />
  }
  const busy = props.phase === 'connecting' || props.phase === 'verifying'
  const emailMode = props.phase === 'email_code' || props.phase === 'verifying'
  return (
    <View style={panelStyles.block}>
      {emailMode ? (
        <EmailCodeForm {...props} busy={busy} />
      ) : (
        <CredentialsForm {...props} busy={busy} />
      )}
      <Text style={[panelStyles.security, settingsHintStyle(props.k)]}>
        {strings.mifit_security}
      </Text>
      {props.error && (
        <Text style={[panelStyles.error, settingsHintStyle(props.k)]}>{props.error}</Text>
      )}
    </View>
  )
}

function CredentialsForm(props: DisconnectedStateProps & { busy: boolean }) {
  const canConnect = Boolean(props.region && props.username.trim() && props.password && !props.busy)
  return (
    <>
      <RegionSelector k={props.k} value={props.region} onChange={props.setRegion} />
      <TextInput
        style={[panelStyles.input, settingsInputStyle(props.k)]}
        placeholder={strings.mifit_username}
        placeholderTextColor={spriteColors.tan}
        value={props.username}
        onChangeText={props.setUsername}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TextInput
        style={[panelStyles.input, settingsInputStyle(props.k)]}
        placeholder={strings.mifit_password}
        placeholderTextColor={spriteColors.tan}
        value={props.password}
        onChangeText={props.setPassword}
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry
      />
      <SettingsSpriteButton
        k={props.k}
        label={props.busy ? strings.mifit_connecting : strings.mifit_connect}
        onPress={props.connect}
        disabled={!canConnect}
      />
    </>
  )
}

function EmailCodeForm(props: DisconnectedStateProps & { busy: boolean }) {
  return (
    <>
      <Text style={[panelStyles.hint, settingsHintStyle(props.k)]}>{strings.mifit_email_sent}</Text>
      <TextInput
        style={[panelStyles.input, settingsInputStyle(props.k)]}
        placeholder={strings.mifit_email_code}
        placeholderTextColor={spriteColors.tan}
        value={props.code}
        onChangeText={props.setCode}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="number-pad"
      />
      <SettingsSpriteButton
        k={props.k}
        label={props.busy ? strings.mifit_verifying : strings.mifit_verify}
        onPress={props.verify}
        disabled={!props.code.trim() || props.busy}
      />
    </>
  )
}

function RegionSelector({
  k,
  value,
  onChange,
}: {
  k: number
  value: MiFitnessRegion | null
  onChange: (region: MiFitnessRegion) => void
}) {
  return (
    <View style={panelStyles.block}>
      <Text style={[panelStyles.hint, settingsHintStyle(k)]}>{strings.mifit_region_help}</Text>
      <View style={panelStyles.regionGrid}>
        {MIFIT_REGIONS.map((region) => (
          <Pressable
            key={region}
            accessibilityRole="button"
            accessibilityState={{ selected: value === region }}
            onPress={() => onChange(region)}
            style={[
              panelStyles.regionOption,
              settingsOptionStyle(k),
              value === region && panelStyles.regionSelected,
            ]}
          >
            <Text style={[panelStyles.regionText, settingsHintStyle(k)]}>
              {REGION_LABELS[region]}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  )
}

export const panelStyles = StyleSheet.create({
  label: {
    fontFamily: theme.fontFamily,
    color: spriteColors.tan,
    textTransform: 'uppercase',
    textShadowColor: spriteColors.outline,
    textShadowRadius: 0,
  },
  value: {
    fontFamily: theme.fontFamily,
    color: spriteColors.cream,
    textShadowColor: spriteColors.outline,
    textShadowRadius: 0,
  },
  block: {
    gap: theme.spacing(3),
  },
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
    textTransform: 'none',
  },
  security: {
    fontFamily: theme.fontFamily,
    color: spriteColors.goldLight,
    textTransform: 'none',
  },
  error: {
    fontFamily: theme.fontFamily,
    color: spriteColors.red,
    textTransform: 'none',
  },
  regionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing(2),
  },
  regionOption: {
    backgroundColor: spriteColors.trackWell,
    borderWidth: 3,
    borderColor: spriteColors.outline,
    borderRadius: 4,
  },
  regionSelected: {
    borderColor: spriteColors.gold,
  },
  regionText: {
    fontFamily: theme.fontFamily,
    color: spriteColors.cream,
  },
})
