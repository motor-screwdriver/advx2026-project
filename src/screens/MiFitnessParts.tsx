import React from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'

import { MIFIT_REGIONS, type MiFitnessRegion } from '../contracts/mifit'
import type { MiFitnessLoginPhase } from '../ui/mifitLoginFlow'
import { PixelButton } from '../ui/PixelButton'
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
  region: MiFitnessRegion | null
  savedAt: string | null
  onDisconnect: () => void
}

interface DisconnectedStateProps {
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

export function ConnectedState({ region, savedAt, onDisconnect }: ConnectedStateProps) {
  return (
    <View style={panelStyles.block}>
      <Text style={panelStyles.value}>{strings.mifit_connected}</Text>
      <Text style={panelStyles.hint}>{region ? `${strings.mifit_region}: ${region}` : ''}</Text>
      <Text style={panelStyles.hint}>{savedAt ? strings.mifit_saved_device : ''}</Text>
      <PixelButton compact label={strings.mifit_disconnect} onPress={onDisconnect} />
    </View>
  )
}

export function DisconnectedState(props: DisconnectedStateProps) {
  if (props.phase === 'idle') {
    return <PixelButton compact label={strings.mifit_login} onPress={props.openForm} />
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
      <Text style={panelStyles.security}>{strings.mifit_security}</Text>
      {props.error && <Text style={panelStyles.error}>{props.error}</Text>}
    </View>
  )
}

function CredentialsForm(props: DisconnectedStateProps & { busy: boolean }) {
  const canConnect = Boolean(props.region && props.username.trim() && props.password && !props.busy)
  return (
    <>
      <RegionSelector value={props.region} onChange={props.setRegion} />
      <TextInput
        style={panelStyles.input}
        placeholder={strings.mifit_username}
        placeholderTextColor={spriteColors.tan}
        value={props.username}
        onChangeText={props.setUsername}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TextInput
        style={panelStyles.input}
        placeholder={strings.mifit_password}
        placeholderTextColor={spriteColors.tan}
        value={props.password}
        onChangeText={props.setPassword}
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry
      />
      <PixelButton
        compact
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
      <Text style={panelStyles.hint}>{strings.mifit_email_sent}</Text>
      <TextInput
        style={panelStyles.input}
        placeholder={strings.mifit_email_code}
        placeholderTextColor={spriteColors.tan}
        value={props.code}
        onChangeText={props.setCode}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="number-pad"
      />
      <PixelButton
        compact
        label={props.busy ? strings.mifit_verifying : strings.mifit_verify}
        onPress={props.verify}
        disabled={!props.code.trim() || props.busy}
      />
    </>
  )
}

function RegionSelector({
  value,
  onChange,
}: {
  value: MiFitnessRegion | null
  onChange: (region: MiFitnessRegion) => void
}) {
  return (
    <View style={panelStyles.block}>
      <Text style={panelStyles.hint}>{strings.mifit_region_help}</Text>
      <View style={panelStyles.regionGrid}>
        {MIFIT_REGIONS.map((region) => (
          <Pressable
            key={region}
            accessibilityRole="button"
            accessibilityState={{ selected: value === region }}
            onPress={() => onChange(region)}
            style={[panelStyles.regionOption, value === region && panelStyles.regionSelected]}
          >
            <Text style={panelStyles.regionText}>{REGION_LABELS[region]}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  )
}

export const panelStyles = StyleSheet.create({
  label: {
    ...theme.type.label,
    color: spriteColors.tan,
    textTransform: 'uppercase',
  },
  value: {
    ...theme.type.body,
    color: spriteColors.cream,
  },
  block: {
    gap: theme.spacing(3),
  },
  input: {
    ...theme.type.body,
    color: spriteColors.cream,
    backgroundColor: spriteColors.trackWell,
    borderWidth: theme.borderWidth,
    borderColor: spriteColors.outline,
    borderRadius: theme.borderRadius,
    padding: theme.spacing(3),
  },
  hint: {
    ...theme.type.label,
    color: spriteColors.tan,
    textTransform: 'none',
  },
  security: {
    ...theme.type.label,
    color: spriteColors.goldLight,
    textTransform: 'none',
  },
  error: {
    ...theme.type.label,
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
    borderWidth: theme.borderWidth,
    borderColor: spriteColors.outline,
    borderRadius: theme.borderRadius,
    paddingHorizontal: theme.spacing(2),
    paddingVertical: theme.spacing(2),
  },
  regionSelected: {
    borderColor: spriteColors.gold,
  },
  regionText: {
    ...theme.type.label,
    color: spriteColors.cream,
  },
})
