import { useLocalSearchParams } from 'expo-router'
import React, { useState } from 'react'
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { DESIGN } from '../../assets/manifest'
import { PixelSprite } from '../ui/PixelSprite'
import { useScreenTransition } from '../ui/screenTransition'
import { strings } from '../ui/strings'
import { theme } from '../ui/theme'
import { useGame } from '../ui/useGame'
import { MAX_SLEEP_MIN, MIN_SLEEP_MIN } from '../ui/window'
import { SpriteWheel } from './OnboardingWheel'

const STEP = 15
const range = (from: number, to: number) =>
  Array.from({ length: (to - from) / STEP + 1 }, (_, i) => from + i * STEP)

// Bedtime 20:00..00:00, wake 04:00..10:00 (night-line minutes from noon).
const BED_MIN = 480
const BED_MAX = 720
const WAKE_MIN = 960
const WAKE_MAX = 1320
const BED_VALUES = range(BED_MIN, BED_MAX)
const WAKE_VALUES = range(WAKE_MIN, WAKE_MAX)

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

function minuteParam(
  value: string | string[] | undefined,
  fallback: number,
  min: number,
  max: number,
): number {
  const parsed = Number(Array.isArray(value) ? value[0] : value)
  return Number.isInteger(parsed) && parsed % STEP === 0 && parsed >= min && parsed <= max
    ? parsed
    : fallback
}

/** Warning text for an invalid window duration, or null when valid. */
function windowWarning(bedMin: number, wakeMin: number): string | null {
  const duration = wakeMin - bedMin
  if (duration < MIN_SLEEP_MIN) {
    return strings.onboarding_min_hours
  }
  if (duration > MAX_SLEEP_MIN) {
    return strings.onboarding_max_hours
  }
  return null
}

export function OnboardingScreen() {
  const go = useScreenTransition()
  const params = useLocalSearchParams<{
    source?: string
    mode?: string
    bedMin?: string
    wakeMin?: string
  }>()
  const { state, changeWindow, completeOnboarding } = useGame()
  const editing = params.mode === 'change'
  const adjusted = params.source === 'oracle'
  const initialBed = editing
    ? clamp(state.window?.bedMin ?? 690, BED_MIN, BED_MAX)
    : minuteParam(params.bedMin, 690, BED_MIN, BED_MAX)
  const initialWake = editing
    ? clamp(state.window?.wakeMin ?? 1140, WAKE_MIN, WAKE_MAX)
    : minuteParam(params.wakeMin, 1140, WAKE_MIN, WAKE_MAX)
  const [bedMin, setBedMin] = useState(initialBed)
  const [wakeMin, setWakeMin] = useState(initialWake)
  const [blocked, setBlocked] = useState(false)
  const warning = windowWarning(bedMin, wakeMin)
  const valid = warning === null

  const begin = () => {
    if (editing) {
      if (!changeWindow({ bedMin, wakeMin })) {
        setBlocked(true)
        return
      }
      go('/', { replace: true })
      return
    }
    completeOnboarding({ bedMin, wakeMin })
    go('/', { replace: true })
  }

  const compactIntro = editing ? strings.onboarding_change_body : strings.onboarding_adjust_body

  return (
    <OnboardingView
      compactIntro={editing || adjusted ? compactIntro : null}
      bedMin={bedMin}
      wakeMin={wakeMin}
      valid={valid}
      warning={warning}
      blocked={blocked}
      showBack={editing || adjusted}
      onBedChange={setBedMin}
      onWakeChange={setWakeMin}
      onBegin={begin}
      onBack={() => go.back()}
    />
  )
}

interface OnboardingViewProps {
  compactIntro: string | null
  bedMin: number
  wakeMin: number
  valid: boolean
  warning: string | null
  blocked: boolean
  showBack: boolean
  onBedChange: (value: number) => void
  onWakeChange: (value: number) => void
  onBegin: () => void
  onBack: () => void
}

/** Prototype 01-онбординг: logo, rules panel, two sprite wheels, BEGIN, caption. */
function OnboardingView(props: OnboardingViewProps) {
  const { width } = useWindowDimensions()
  const contentW = Math.min(width, 480)
  const wheelW = (contentW - theme.spacing(4) * 2 - theme.spacing(3)) / 2

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <PixelSprite sprite={DESIGN.onboarding_logo_text} size={contentW * 0.6} />
        {props.compactIntro ? (
          <Text style={styles.introText}>{props.compactIntro}</Text>
        ) : (
          <PixelSprite sprite={DESIGN.onboarding_panel_rules_card} size={contentW * 0.9} />
        )}
        <View style={styles.wheels}>
          <SpriteWheel
            windowSprite={DESIGN.onboarding_picker_window_bedtime}
            values={BED_VALUES}
            value={props.bedMin}
            onChange={props.onBedChange}
            width={wheelW}
          />
          <SpriteWheel
            windowSprite={DESIGN.onboarding_picker_window_wakeup}
            values={WAKE_VALUES}
            value={props.wakeMin}
            onChange={props.onWakeChange}
            width={wheelW}
          />
        </View>
        {props.blocked && <Text style={styles.warning}>{strings.onboarding_change_blocked}</Text>}
        <Pressable
          onPress={props.onBegin}
          disabled={!props.valid}
          style={({ pressed }) => [
            !props.valid && styles.beginDisabled,
            pressed && props.valid && styles.beginPressed,
          ]}
        >
          <PixelSprite sprite={DESIGN.onboarding_button_begin_plaque} size={contentW * 0.84} />
        </Pressable>
        {props.warning ? (
          <Text style={styles.warning}>{props.warning}</Text>
        ) : (
          <PixelSprite sprite={DESIGN.onboarding_caption_min_hours} size={contentW * 0.46} />
        )}
        {props.showBack && (
          <Pressable onPress={props.onBack} style={({ pressed }) => pressed && styles.beginPressed}>
            <Text style={styles.back}>{strings.common_back}</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0a0705',
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing(2.5),
  },
  introText: {
    ...theme.type.body,
    color: theme.colors.textDim,
    textAlign: 'center',
    paddingHorizontal: theme.spacing(6),
  },
  wheels: {
    flexDirection: 'row',
    gap: theme.spacing(3),
    paddingHorizontal: theme.spacing(4),
  },
  beginDisabled: { opacity: 0.4 },
  beginPressed: { opacity: 0.75 },
  warning: {
    ...theme.type.label,
    color: theme.colors.heartFull,
    textAlign: 'center',
  },
  back: {
    ...theme.type.label,
    color: theme.colors.textDim,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
})
