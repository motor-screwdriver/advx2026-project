import React, { useEffect, useRef, useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'

import { ICONS, SPRITES } from '../../assets/manifest'
import { PixelSprite } from '../ui/PixelSprite'
import { strings } from '../ui/strings'
import { GoldButton, Parchment, WoodPanel } from '../ui/tavern'
import { formatClock } from '../ui/window'
import { styles, WHEEL_ITEM_H } from './onboardingStyles'

// New copy for this flow (kept local; strings.ts is owned elsewhere).
const COPY = {
  choiceEarly: 'BEFORE 22:00',
  choiceNormal: '22:00 - 00:00',
  choiceLate: 'AFTER MIDNIGHT',
  yourWindow: 'YOUR WINDOW',
  begin: 'BEGIN',
  minHours: 'MIN 7 HOURS',
  title: '8BIT SLEEP',
  questionPrompt: 'WHEN DO YOU USUALLY GO TO BED?',
  proposalPrompt: 'HERE IS YOUR SLEEP WINDOW, ADVENTURER.',
  accept: 'ACCEPT',
  adjust: 'ADJUST',
} as const

const STEP = 15
const range = (from: number, to: number) =>
  Array.from({ length: (to - from) / STEP + 1 }, (_, i) => from + i * STEP)

// Bedtime 18:00..03:00, wake 00:00..12:00 (night-line minutes from noon).
const BED_VALUES = range(360, 900)
const WAKE_VALUES = range(720, 1440)

/** Mockup 01a: innkeeper scene, dialogue panel, three wood answer buttons. */
export function QuestionStep({ onAnswer }: { onAnswer: (bed: number, wake: number) => void }) {
  return (
    <View style={styles.step}>
      <Text style={styles.logoText}>{COPY.title}</Text>
      <WoodPanel contentStyle={styles.dialogWell}>
        <Parchment>
          <Text style={styles.dialogText}>{COPY.questionPrompt}</Text>
        </Parchment>
      </WoodPanel>
      <View style={styles.choices}>
        <ChoiceButton label={COPY.choiceEarly} onPress={() => onAnswer(570, 1110)} />
        <ChoiceButton label={COPY.choiceNormal} onPress={() => onAnswer(690, 1170)} />
        <ChoiceButton label={COPY.choiceLate} onPress={() => onAnswer(750, 1230)} />
      </View>
    </View>
  )
}

/** Mockup 01b: ledger scene, proposed window strip, ACCEPT / ADJUST. */
export function ProposalStep({
  bedMin,
  wakeMin,
  onAccept,
  onAdjust,
}: {
  bedMin: number
  wakeMin: number
  onAccept: () => void
  onAdjust: () => void
}) {
  return (
    <View style={styles.step}>
      <Text style={styles.logoText}>{COPY.title}</Text>
      <WoodPanel contentStyle={styles.dialogWell}>
        <Parchment>
          <Text style={styles.dialogText}>{COPY.proposalPrompt}</Text>
        </Parchment>
      </WoodPanel>
      <View style={styles.windowInset}>
        <Text style={styles.windowInsetText}>
          {COPY.yourWindow} {formatClock(bedMin)} - {formatClock(wakeMin)}
        </Text>
      </View>
      <GoldButton label={COPY.accept} onPress={onAccept} />
      <Pressable onPress={onAdjust} style={({ pressed }) => pressed && styles.pressed}>
        <View style={styles.adjustBtn}>
          <Text style={styles.adjustLabel}>{COPY.adjust}</Text>
        </View>
      </Pressable>
    </View>
  )
}

/** Mockup 01: logo, rules panel, two wheel pickers, BEGIN, MIN 7 HOURS. */
export function AdjustStep({
  bedMin,
  wakeMin,
  valid,
  onBedChange,
  onWakeChange,
  onBegin,
}: {
  bedMin: number
  wakeMin: number
  valid: boolean
  onBedChange: (value: number) => void
  onWakeChange: (value: number) => void
  onBegin: () => void
}) {
  return (
    <View style={styles.step}>
      <Text style={styles.logoText}>{COPY.title}</Text>
      <RulesPanel />
      <View style={styles.wheels}>
        <WheelColumn
          label={strings.onboarding_bedtime}
          values={BED_VALUES}
          value={bedMin}
          onChange={onBedChange}
        />
        <WheelColumn
          label={strings.onboarding_wakeup}
          values={WAKE_VALUES}
          value={wakeMin}
          onChange={onWakeChange}
        />
      </View>
      <View style={!valid && styles.disabled}>
        <GoldButton label={COPY.begin} onPress={valid ? onBegin : undefined} />
      </View>
      <View style={styles.captionRow}>
        <CaptionDiamond />
        <Text style={[styles.caption, !valid && styles.captionInvalid]}>{COPY.minHours}</Text>
        <CaptionDiamond />
      </View>
    </View>
  )
}

/** Rules panel from mockup 01: three icon rows on parchment inside a wood frame. */
function RulesPanel() {
  return (
    <WoodPanel contentStyle={styles.rulesWell}>
      <Parchment>
        <View style={styles.rules}>
          <RuleRow
            icon={<PixelSprite sprite={SPRITES.hero_knight} size={28} frame={0} animated={false} />}
            text={strings.onboarding_intro_1}
          />
          <RuleRow
            icon={<PixelSprite sprite={ICONS.heart_full} size={26} animated={false} />}
            text={strings.onboarding_intro_2}
          />
          <RuleRow
            icon={<PixelSprite sprite={SPRITES.chest} size={28} frame={0} animated={false} />}
            text={strings.onboarding_intro_3}
          />
        </View>
      </Parchment>
    </WoodPanel>
  )
}

function RuleRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <View style={styles.ruleRow}>
      <View style={styles.ruleIcon}>{icon}</View>
      <Text style={styles.ruleText}>{text}</Text>
    </View>
  )
}

function ChoiceButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.choice, pressed && styles.pressed]}
    >
      <Text style={styles.choiceLabel}>{label}</Text>
    </Pressable>
  )
}

function CaptionDiamond() {
  return <View style={styles.captionDiamond} />
}

interface WheelColumnProps {
  label: string
  values: readonly number[]
  value: number
  onChange: (value: number) => void
}

/** Wheel column from mockup 01: gold plaque label, sunken well, gold center row with side chevrons. */
function WheelColumn({ label, values, value, onChange }: WheelColumnProps) {
  const scrollRef = useRef<ScrollView>(null)
  const [selectedIndex, setSelectedIndex] = useState(() => Math.max(0, values.indexOf(value)))

  useEffect(() => {
    const index = Math.max(0, values.indexOf(value))
    setSelectedIndex(index)
    scrollRef.current?.scrollTo({ y: index * WHEEL_ITEM_H, animated: false })
  }, [values, value])

  const commit = (offsetY: number) => {
    const index = Math.min(Math.max(0, Math.round(offsetY / WHEEL_ITEM_H)), values.length - 1)
    setSelectedIndex(index)
    onChange(values[index])
  }

  return (
    <View style={styles.wheelColumn}>
      <View style={styles.wheelPlaque}>
        <Text style={styles.wheelPlaqueText}>{label.toUpperCase()}</Text>
      </View>
      <View style={styles.wheelFrame}>
        <View style={styles.wheelWell}>
          <View style={styles.wheelHighlight} pointerEvents="none">
            <View style={styles.chevron} />
            <View style={styles.chevron} />
          </View>
          <ScrollView
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
            snapToInterval={WHEEL_ITEM_H}
            decelerationRate="fast"
            contentContainerStyle={{ paddingVertical: WHEEL_ITEM_H * 2 }}
            onScroll={(event) =>
              setSelectedIndex(Math.round(event.nativeEvent.contentOffset.y / WHEEL_ITEM_H))
            }
            scrollEventThrottle={16}
            onMomentumScrollEnd={(event) => commit(event.nativeEvent.contentOffset.y)}
          >
            {values.map((item, index) => (
              <View key={item} style={styles.wheelItem}>
                <Text
                  style={[styles.wheelText, index === selectedIndex && styles.wheelTextSelected]}
                >
                  {formatClock(item)}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </View>
  )
}
