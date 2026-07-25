import React, { useState } from 'react'
import {
  Animated,
  Image,
  ImageBackground,
  type LayoutChangeEvent,
  Pressable,
  type StyleProp,
  StyleSheet,
  Text,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native'

import { DESIGN } from '../../assets/manifest'
import { ROW_W, spriteColors, useRowEntrance } from './settingsSprite'
import { theme } from './theme'

const DROPDOWN_TOP_H = 170
const DROPDOWN_MID_H = 100
const DROPDOWN_BOTTOM_H = 170
const BUTTONS = {
  wood: {
    source: require('../../assets/buttons/gen/btn_wood_compact.png'),
    pressed: require('../../assets/buttons/gen/btn_wood_compact_pressed.png'),
  },
  gold: {
    source: require('../../assets/buttons/gen/btn_gold.png'),
    pressed: require('../../assets/buttons/gen/btn_gold_pressed.png'),
  },
} as const

interface SettingsDropdownPanelProps {
  k: number
  children: React.ReactNode
  contentStyle?: StyleProp<ViewStyle>
  delay?: number
}

interface SettingsSpriteButtonProps {
  label: string
  k: number
  onPress?: () => void
  disabled?: boolean
  tone?: keyof typeof BUTTONS
  danger?: boolean
  style?: StyleProp<ViewStyle>
}

export function settingsTitleStyle(k: number) {
  return {
    fontSize: Math.max(18, 64 * k),
    lineHeight: Math.max(24, 78 * k),
    letterSpacing: Math.max(1, 6 * k),
    textShadowOffset: { width: 0, height: Math.max(1, 4 * k) },
  }
}

export function settingsValueStyle(k: number) {
  return {
    fontSize: Math.max(18, 58 * k),
    lineHeight: Math.max(24, 70 * k),
    letterSpacing: Math.max(1, 4 * k),
    textShadowOffset: { width: 0, height: Math.max(1, 4 * k) },
  }
}

export function settingsHintStyle(k: number) {
  return {
    fontSize: Math.max(11, 34 * k),
    lineHeight: Math.max(16, 46 * k),
    letterSpacing: Math.max(0.5, 2 * k),
  }
}

export function settingsInputStyle(k: number) {
  return {
    fontSize: Math.max(13, 38 * k),
    lineHeight: Math.max(18, 48 * k),
    paddingHorizontal: Math.max(14, 42 * k),
    paddingVertical: Math.max(12, 34 * k),
  }
}

export function settingsOptionStyle(k: number) {
  return {
    paddingHorizontal: Math.max(10, 28 * k),
    paddingVertical: Math.max(8, 22 * k),
  }
}

function DropdownSpriteBackground({ height, k }: { height: number; k: number }) {
  const top = DESIGN.settings_dropdown_top
  const mid = DESIGN.settings_dropdown_mid
  const bottom = DESIGN.settings_dropdown_bottom
  const topH = top.height * k
  const bottomH = bottom.height * k
  const midH = Math.max(DROPDOWN_MID_H * k, height - topH - bottomH)
  return (
    <>
      <Image
        source={mid.source}
        style={[styles.dropdownMid, { top: topH, width: mid.width * k, height: midH }]}
        resizeMode="stretch"
      />
      <Image
        source={top.source}
        style={[styles.dropdownCap, { width: top.width * k, height: topH, top: 0 }]}
        resizeMode="stretch"
      />
      <Image
        source={bottom.source}
        style={[styles.dropdownCap, { width: bottom.width * k, height: bottomH, bottom: 0 }]}
        resizeMode="stretch"
      />
    </>
  )
}

export function SettingsDropdownPanel({
  k,
  children,
  contentStyle,
  delay = 0,
}: SettingsDropdownPanelProps) {
  const { opacity, translateY } = useRowEntrance(delay)
  const [contentHeight, setContentHeight] = useState(0)
  const minHeight = (DROPDOWN_TOP_H + DROPDOWN_MID_H + DROPDOWN_BOTTOM_H) * k
  const panelHeight = Math.max(minHeight, contentHeight)
  const onContentLayout = (event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout.height
    setContentHeight((prev) => (Math.abs(prev - next) > 1 ? next : prev))
  }
  return (
    <Animated.View
      style={[
        styles.dropdownRoot,
        { width: ROW_W * k, height: panelHeight, opacity, transform: [{ translateY }] },
      ]}
    >
      <DropdownSpriteBackground height={panelHeight} k={k} />
      <View
        onLayout={onContentLayout}
        style={[
          styles.dropdownContent,
          {
            minHeight: 440 * k,
            paddingHorizontal: 96 * k,
            paddingVertical: 70 * k,
            gap: 34 * k,
          },
          contentStyle,
        ]}
      >
        {children}
      </View>
    </Animated.View>
  )
}

export function SettingsSpriteButton(props: SettingsSpriteButtonProps) {
  const { label, k, onPress, disabled = false, tone = 'wood', danger = false, style } = props
  const assets = BUTTONS[tone]
  const labelStyle: TextStyle = {
    fontSize: Math.max(12, 38 * k),
    lineHeight: Math.max(16, 46 * k),
    letterSpacing: Math.max(1, 5 * k),
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.spriteButton,
        { height: Math.max(42, 112 * k) },
        disabled && styles.disabled,
        style,
        pressed && !disabled && styles.buttonPressed,
      ]}
    >
      {({ pressed }) => (
        <ImageBackground
          source={pressed && !disabled ? assets.pressed : assets.source}
          style={styles.buttonBg}
          resizeMode="stretch"
        >
          <Text
            style={[
              styles.buttonLabel,
              labelStyle,
              tone === 'gold' && styles.buttonLabelGold,
              danger && styles.buttonLabelDanger,
            ]}
          >
            {label}
          </Text>
        </ImageBackground>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  dropdownRoot: { position: 'relative', overflow: 'hidden' },
  dropdownCap: { position: 'absolute', left: 0 },
  dropdownMid: { position: 'absolute', left: 0 },
  dropdownContent: { position: 'relative' },
  spriteButton: { width: '100%' },
  buttonBg: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  buttonPressed: { transform: [{ translateY: 2 }] },
  disabled: { opacity: 0.45 },
  buttonLabel: {
    fontFamily: theme.fontFamily,
    color: spriteColors.goldLight,
    textAlign: 'center',
    textTransform: 'uppercase',
    textShadowColor: spriteColors.outline,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 0,
  },
  buttonLabelGold: { color: spriteColors.inkOnGold, textShadowColor: 'transparent' },
  buttonLabelDanger: { color: spriteColors.red },
})
