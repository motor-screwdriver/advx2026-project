import React from 'react'
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native'

import { CornerRivets, WoodPanel, tavernColors as wood } from './tavernBase'
import { theme } from './theme'

/**
 * Tavern UI kit — interactive controls (see tavern.tsx for the barrel
 * export): GoldButton, WoodButton, StatBadge, TavernBar.
 *
 * EVERY button in the app is the same tavern control — same 2px riveted
 * edge, same bevel body, same pixel-bold label sizes (16 regular / 12
 * compact), same press-sink. Palette is the only difference: honey gold for
 * the primary action, dim wood for secondary (danger = red label).
 */

function BaseButton({
  label,
  onPress,
  colors,
  textColor,
  style,
  compact = false,
  disabled = false,
}: {
  label: string
  onPress?: () => void
  colors: { edge: string; top: string; fill: string; bottom: string }
  textColor: string
  style?: StyleProp<ViewStyle>
  compact?: boolean
  disabled?: boolean
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.btnEdge,
        { backgroundColor: colors.edge },
        pressed && !disabled && { transform: [{ translateY: 2 }] },
        disabled && styles.btnDisabled,
        style,
      ]}
    >
      <View
        style={[
          styles.btnBody,
          {
            backgroundColor: colors.fill,
            borderTopColor: colors.top,
            borderBottomColor: colors.bottom,
          },
        ]}
      >
        <Text style={[compact ? styles.btnLabelCompact : styles.btnLabel, { color: textColor }]}>
          {label}
        </Text>
      </View>
      <CornerRivets size={4} inset={5} />
    </Pressable>
  )
}

/** Generic tavern button — the one unified control behind every app button. */
export function TavernButton(props: {
  label: string
  onPress?: () => void
  style?: StyleProp<ViewStyle>
  compact?: boolean
  disabled?: boolean
}) {
  return (
    <BaseButton
      {...props}
      colors={{ edge: wood.edge, top: wood.light, fill: wood.mid, bottom: wood.dark }}
      textColor={theme.colors.gold}
    />
  )
}

/** Big honey-gold primary action (BEGIN / ACCEPT / CONTINUE / TAKE IT). */
export function GoldButton(props: {
  label: string
  onPress?: () => void
  style?: StyleProp<ViewStyle>
  compact?: boolean
}) {
  return (
    <BaseButton
      {...props}
      colors={{ edge: wood.edge, top: wood.goldLight, fill: wood.gold, bottom: wood.goldEdge }}
      textColor={wood.inkOnParchment}
    />
  )
}

/** Dim wood secondary action (ADJUST / LET GO / CLOSE / LEAVE RAID). */
export function WoodButton(props: {
  label: string
  onPress?: () => void
  style?: StyleProp<ViewStyle>
  compact?: boolean
  danger?: boolean
}) {
  return (
    <BaseButton
      {...props}
      colors={{ edge: wood.edge, top: wood.light, fill: wood.mid, bottom: wood.dark }}
      textColor={props.danger ? wood.danger : theme.colors.textDim}
    />
  )
}

/** Small framed stat badge (LV 2 / STREAK 3 / PERFECT 68%). */
export function StatBadge({ label, value }: { label: string; value: string }) {
  return (
    <WoodPanel rivets={false} contentStyle={styles.badgeWell}>
      <Text style={styles.badgeLabel}>{label}</Text>
      <Text style={styles.badgeValue}>{value}</Text>
    </WoodPanel>
  )
}

/** Wood-framed progress bar (XP, team chest). */
export function TavernBar({
  value,
  max,
  color = theme.colors.leaf,
  height = 14,
}: {
  value: number
  max: number
  color?: string
  height?: number
}) {
  const pct = Math.max(0, Math.min(1, max === 0 ? 0 : value / max))
  return (
    <View style={[styles.barEdge, { height: height + 8 }]}>
      <View style={styles.barWell}>
        <View style={{ width: `${pct * 100}%`, height, backgroundColor: color }} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  btnEdge: {
    borderWidth: 2,
    position: 'relative',
  },
  btnDisabled: {
    opacity: 0.4,
  },
  btnBody: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing(3),
    paddingHorizontal: theme.spacing(4),
    borderTopWidth: 3,
    borderBottomWidth: 3,
  },
  btnLabel: {
    fontFamily: theme.fontFamily,
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: 2,
  },
  btnLabelCompact: {
    fontFamily: theme.fontFamily,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1,
  },
  badgeWell: {
    alignItems: 'center',
    paddingVertical: theme.spacing(2),
    gap: theme.spacing(1),
  },
  badgeLabel: { ...theme.type.label, color: theme.colors.textDim },
  badgeValue: { ...theme.type.body, color: wood.goldLight },
  barEdge: {
    backgroundColor: wood.edge,
    padding: 4,
    borderWidth: 1,
    borderColor: wood.dark,
  },
  barWell: {
    flex: 1,
    backgroundColor: '#180e07',
    justifyContent: 'center',
  },
})
