import React from 'react'
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native'

import { BUTTONS, type SpriteEntry } from '../../assets/manifest'
import { tavernColors as wood } from './tavernBase'
import { theme } from './theme'

/**
 * Tavern UI kit — interactive controls (see tavern.tsx for the barrel
 * export): GoldButton, WoodButton, StatBadge, TavernBar.
 *
 * EVERY button in the app is the same tavern control — a hand-drawn sprite
 * pair (assets/buttons, BUTTONS manifest section) with a pixel-bold label
 * (16 regular / 12 compact); the pressed sprite swaps in while held. Palette
 * is the only difference: honey gold for the primary action, dim wood for
 * secondary (danger = red label), dark chip for the generic control.
 */

function BaseButton({
  label,
  onPress,
  up,
  down,
  textColor,
  style,
  compact = false,
  disabled = false,
}: {
  label: string
  onPress?: () => void
  up: SpriteEntry
  down: SpriteEntry
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
      style={[styles.btn, disabled && styles.btnDisabled, style]}
    >
      {({ pressed }) => (
        <>
          <Image
            source={pressed && !disabled ? down.source : up.source}
            resizeMode="stretch"
            fadeDuration={0}
            style={StyleSheet.absoluteFill}
          />
          <View style={compact ? styles.bodyCompact : styles.body}>
            <Text
              style={[compact ? styles.btnLabelCompact : styles.btnLabel, { color: textColor }]}
            >
              {label}
            </Text>
          </View>
        </>
      )}
    </Pressable>
  )
}

/** Generic tavern button — dark gold-framed chip behind every plain action. */
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
      up={BUTTONS.chip_dark}
      down={BUTTONS.chip_dark_pressed}
      textColor={wood.gold}
    />
  )
}

/** Big honey-gold primary action (BEGIN / ACCEPT / CONTINUE / TAKE IT). */
export function GoldButton(props: {
  label: string
  onPress?: () => void
  style?: StyleProp<ViewStyle>
  compact?: boolean
  /** Ornate CTA frame for the one big action of a screen (SLEEP / WAKE UP). */
  cta?: boolean
}) {
  return (
    <BaseButton
      {...props}
      up={props.cta ? BUTTONS.btn_gold_cta : BUTTONS.btn_gold}
      down={props.cta ? BUTTONS.btn_gold_cta_pressed : BUTTONS.btn_gold_pressed}
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
      up={props.compact ? BUTTONS.btn_wood_compact : BUTTONS.btn_wood}
      down={props.compact ? BUTTONS.btn_wood_compact_pressed : BUTTONS.btn_wood_pressed}
      textColor={props.danger ? wood.danger : theme.colors.text}
    />
  )
}

/** Hand-drawn sunken-wood plaque — the quiet answer/secondary tavern button. */
export function SunkenButton(props: {
  label: string
  onPress?: () => void
  style?: StyleProp<ViewStyle>
  compact?: boolean
}) {
  return (
    <BaseButton
      {...props}
      up={BUTTONS.btn_sunken}
      down={BUTTONS.btn_sunken_pressed}
      textColor={wood.goldLight}
    />
  )
}

/** Small framed stat badge (LV 2 / STREAK 3 / PERFECT 68%). */
export function StatBadge({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.badgeWell}>
      <Text style={styles.badgeLabel}>{label}</Text>
      <Text style={styles.badgeValue}>{value}</Text>
    </View>
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
  btn: {
    position: 'relative',
  },
  btnDisabled: {
    opacity: 0.4,
  },
  body: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing(4),
    paddingHorizontal: theme.spacing(5),
  },
  bodyCompact: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing(2.5),
    paddingHorizontal: theme.spacing(4),
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
    backgroundColor: wood.edge,
    borderWidth: 2,
    borderColor: wood.dark,
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
