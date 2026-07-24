import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { ICONS } from '../../assets/manifest'
import { PixelButton } from '../ui/PixelButton'
import { PixelSprite } from '../ui/PixelSprite'
import { Screen } from '../ui/Screen'
import { strings } from '../ui/strings'
import { theme } from '../ui/theme'
import { useGame } from '../ui/useGame'
import { WheelPicker } from '../ui/WheelPicker'
import { formatClock, formatDuration, MAX_SLEEP_MIN, MIN_SLEEP_MIN } from '../ui/window'

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

function screenTitle(editing: boolean, adjusted: boolean): string {
  if (editing) {
    return strings.onboarding_change_title
  }
  return adjusted ? strings.onboarding_adjust_title : strings.onboarding_title
}

export function OnboardingScreen() {
  const router = useRouter()
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
      router.replace('/hero-ceremony')
      return
    }
    completeOnboarding({ bedMin, wakeMin })
    router.replace('/hero-ceremony')
  }

  const title = screenTitle(editing, adjusted)
  const compactIntro = editing ? strings.onboarding_change_body : strings.onboarding_adjust_body

  return (
    <OnboardingView
      title={title}
      compactIntro={editing || adjusted ? compactIntro : null}
      bedMin={bedMin}
      wakeMin={wakeMin}
      valid={valid}
      warning={warning}
      blocked={blocked}
      editing={editing}
      showBack={editing || adjusted}
      onBedChange={setBedMin}
      onWakeChange={setWakeMin}
      onBegin={begin}
      onBack={() => router.back()}
    />
  )
}

interface OnboardingViewProps {
  title: string
  compactIntro: string | null
  bedMin: number
  wakeMin: number
  valid: boolean
  warning: string | null
  blocked: boolean
  editing: boolean
  showBack: boolean
  onBedChange: (value: number) => void
  onWakeChange: (value: number) => void
  onBegin: () => void
  onBack: () => void
}

function OnboardingView(props: OnboardingViewProps) {
  return (
    <Screen title={props.title}>
      <OnboardingIntro compact={props.compactIntro} />
      <View style={styles.wheels}>
        <WheelColumn
          label={strings.onboarding_bedtime}
          values={BED_VALUES}
          value={props.bedMin}
          onChange={props.onBedChange}
        />
        <WheelColumn
          label={strings.onboarding_wakeup}
          values={WAKE_VALUES}
          value={props.wakeMin}
          onChange={props.onWakeChange}
        />
      </View>
      <Text style={styles.duration}>
        {strings.onboarding_duration}: {formatDuration(props.wakeMin - props.bedMin)}
      </Text>
      {props.warning && <Text style={styles.warning}>{props.warning}</Text>}
      {props.blocked && <Text style={styles.warning}>{strings.onboarding_change_blocked}</Text>}
      <PixelButton
        label={props.editing ? strings.onboarding_save : strings.onboarding_begin}
        onPress={props.onBegin}
        disabled={!props.valid}
      />
      {props.showBack && <PixelButton compact label={strings.common_back} onPress={props.onBack} />}
    </Screen>
  )
}

function OnboardingIntro({ compact }: { compact: string | null }) {
  if (compact) {
    return <Text style={styles.introText}>{compact}</Text>
  }
  return (
    <>
      <View style={styles.logo}>
        <PixelSprite sprite={ICONS.logo} size={120} animated={false} />
      </View>
      <View style={styles.intro}>
        <Text style={styles.introText}>{strings.onboarding_intro_1}</Text>
        <Text style={styles.introText}>{strings.onboarding_intro_2}</Text>
        <Text style={styles.introText}>{strings.onboarding_intro_3}</Text>
      </View>
    </>
  )
}

interface WheelColumnProps {
  label: string
  values: readonly number[]
  value: number
  onChange: (value: number) => void
}

function WheelColumn({ label, values, value, onChange }: WheelColumnProps) {
  return (
    <View style={styles.wheelColumn}>
      <Text style={styles.wheelLabel}>{label}</Text>
      <WheelPicker values={values} format={formatClock} value={value} onChange={onChange} />
    </View>
  )
}

const styles = StyleSheet.create({
  logo: { alignItems: 'center' },
  intro: { gap: theme.spacing(2) },
  introText: {
    ...theme.type.body,
    color: theme.colors.textDim,
    textAlign: 'center',
  },
  wheels: {
    flexDirection: 'row',
    gap: theme.spacing(4),
  },
  wheelColumn: {
    flex: 1,
    gap: theme.spacing(2),
  },
  wheelLabel: {
    ...theme.type.label,
    color: theme.colors.text,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  duration: {
    ...theme.type.body,
    color: theme.colors.text,
    textAlign: 'center',
  },
  warning: {
    ...theme.type.label,
    color: theme.colors.heartFull,
    textAlign: 'center',
  },
})
