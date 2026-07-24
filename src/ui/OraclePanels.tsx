import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { ICONS } from '../../assets/manifest'
import type { SleepRecommendation } from '../contracts/aiOnboarding'
import { PixelButton } from './PixelButton'
import { PixelPanel } from './PixelPanel'
import { PixelSprite } from './PixelSprite'
import { strings } from './strings'
import { theme } from './theme'
import { formatClock, formatDuration } from './window'

export function Nameplate() {
  return (
    <View style={styles.nameplate}>
      <PixelSprite sprite={ICONS.guide_moon_crest} size={36} animated={false} />
      <View style={styles.nameCopy}>
        <Text style={styles.name}>{strings.oracle_name}</Text>
        <Text style={styles.role}>{strings.oracle_role}</Text>
      </View>
    </View>
  )
}

function SecondaryAction({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} hitSlop={8}>
      <Text style={styles.secondary}>{label}</Text>
    </Pressable>
  )
}

export function OracleWelcomePanel({
  onStart,
  onManual,
}: {
  onStart: () => void
  onManual: () => void
}) {
  return (
    <PixelPanel contentStyle={styles.panel}>
      <Nameplate />
      <View style={styles.rule} />
      <Text style={styles.panelTitle}>{strings.oracle_welcome_title}</Text>
      <Text style={styles.body}>{strings.oracle_welcome_body}</Text>
      <PixelButton label={strings.oracle_start} onPress={onStart} />
      <SecondaryAction label={strings.oracle_set_manually} onPress={onManual} />
    </PixelPanel>
  )
}

export function OracleResultPanel({
  recommendation,
  message,
  onAccept,
  onAdjust,
}: {
  recommendation: SleepRecommendation
  message: string
  onAccept: () => void
  onAdjust: () => void
}) {
  return (
    <PixelPanel contentStyle={styles.panel}>
      <Nameplate />
      <Text style={styles.body}>{message}</Text>
      <View style={styles.window}>
        <Text style={styles.windowTitle}>{strings.oracle_result_title}</Text>
        <View style={styles.times}>
          <Text style={styles.time}>{formatClock(recommendation.bedMin)}</Text>
          <Text style={styles.to}>TO</Text>
          <Text style={styles.time}>{formatClock(recommendation.wakeMin)}</Text>
        </View>
        <Text style={styles.duration}>
          {formatDuration(recommendation.wakeMin - recommendation.bedMin)}
        </Text>
      </View>
      <Text style={styles.reason}>{recommendation.reason}</Text>
      <Text style={styles.hint}>
        {strings.oracle_result_hint} {strings.oracle_change_later}
      </Text>
      <PixelButton label={strings.oracle_accept} onPress={onAccept} />
      <SecondaryAction label={strings.oracle_adjust} onPress={onAdjust} />
    </PixelPanel>
  )
}

export function OracleErrorPanel({
  onRetry,
  onManual,
}: {
  onRetry: () => void
  onManual: () => void
}) {
  return (
    <PixelPanel contentStyle={styles.panel}>
      <Nameplate />
      <Text style={styles.panelTitle}>{strings.oracle_error_title}</Text>
      <Text style={styles.body}>{strings.oracle_error_body}</Text>
      <PixelButton label={strings.oracle_retry} onPress={onRetry} />
      <SecondaryAction label={strings.oracle_set_manually} onPress={onManual} />
    </PixelPanel>
  )
}

const styles = StyleSheet.create({
  panel: { gap: theme.spacing(2), paddingVertical: theme.spacing(3) },
  nameplate: { minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: theme.spacing(2) },
  nameCopy: { flex: 1, gap: 2 },
  name: { ...theme.type.body, color: theme.colors.gold, textTransform: 'uppercase' },
  role: { ...theme.type.label, color: theme.colors.textDim, textTransform: 'uppercase' },
  rule: { height: theme.borderWidth, backgroundColor: theme.colors.bevelLight },
  panelTitle: { ...theme.type.body, color: theme.colors.text, textAlign: 'center' },
  body: { ...theme.type.body, color: theme.colors.text, textAlign: 'center' },
  secondary: { ...theme.type.label, color: theme.colors.textDim, textAlign: 'center', padding: 4 },
  window: {
    backgroundColor: theme.colors.inset,
    borderWidth: theme.borderWidth,
    borderColor: theme.colors.bevelLight,
    borderRadius: theme.borderRadius,
    padding: theme.spacing(3),
    gap: theme.spacing(1),
  },
  windowTitle: { ...theme.type.label, color: theme.colors.textDim, textAlign: 'center' },
  times: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing(3),
  },
  time: { ...theme.type.title, fontSize: 16, color: theme.colors.gold },
  to: { ...theme.type.label, color: theme.colors.textDim },
  duration: { ...theme.type.label, color: theme.colors.leaf, textAlign: 'center' },
  reason: { ...theme.type.label, color: theme.colors.text, textAlign: 'center' },
  hint: { ...theme.type.label, color: theme.colors.textDim, textAlign: 'center' },
})
