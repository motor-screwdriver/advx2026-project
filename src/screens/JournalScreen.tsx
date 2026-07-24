import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

import type { NightOutcome, NightRecord, PixelColor } from '../contracts/types'
import { PixelPanel } from '../ui/PixelPanel'
import { Screen } from '../ui/Screen'
import { strings } from '../ui/strings'
import { theme } from '../ui/theme'
import { useGame } from '../ui/useGame'
import { formatClock, formatDuration } from '../ui/window'

const OUTCOME_LABEL: Record<NightOutcome, string> = {
  PERFECT: strings.outcome_perfect,
  GOOD: strings.outcome_good,
  BAD: strings.outcome_bad,
  TERRIBLE: strings.outcome_terrible,
  MISSED: strings.outcome_missed,
}

const PIXEL_DOT: Record<PixelColor, string> = {
  GOLD: theme.colors.pixelGold,
  GRAY: theme.colors.pixelGray,
  BLACK: theme.colors.pixelBlack,
}

/** Full history of scored nights, newest first. Opened from the home top bar. */
export function JournalScreen() {
  const { state } = useGame()
  const nights = [...state.nights].reverse()
  return (
    <Screen title={strings.journal_title} scroll>
      {nights.length === 0 ? (
        <Text style={styles.empty}>{strings.journal_empty}</Text>
      ) : (
        nights.map((night, index) => <NightCard key={`${night.date}-${index}`} night={night} />)
      )}
    </Screen>
  )
}

function NightCard({ night }: { night: NightRecord }) {
  return (
    <PixelPanel contentStyle={styles.card}>
      <View style={styles.row}>
        <Text style={styles.date}>{night.date}</Text>
        <View style={styles.outcomeRow}>
          <View style={[styles.dot, { backgroundColor: PIXEL_DOT[night.pixel] }]} />
          <Text style={styles.outcome}>{OUTCOME_LABEL[night.outcome]}</Text>
        </View>
      </View>
      <Text style={styles.times}>{nightTimes(night)}</Text>
      <View style={styles.row}>
        <Text style={styles.score}>
          {strings.journal_score}: {night.score}
        </Text>
        <Text style={[styles.hp, hpStyle(night.hpDelta)]}>{formatHp(night.hpDelta)}</Text>
      </View>
    </PixelPanel>
  )
}

function nightTimes(night: NightRecord): string {
  if (night.bedTime === null || night.wakeTime === null || night.wakeTime <= night.bedTime) {
    return strings.journal_no_checkin
  }
  const duration = night.wakeTime - night.bedTime
  return `${formatClock(night.bedTime)} - ${formatClock(night.wakeTime)} · ${formatDuration(duration)}`
}

function formatHp(hpDelta: number): string {
  return hpDelta === 0 ? '0 HP' : `${hpDelta > 0 ? '+' : ''}${hpDelta} HP`
}

function hpStyle(hpDelta: number) {
  if (hpDelta > 0) {
    return styles.hpGain
  }
  if (hpDelta < 0) {
    return styles.hpLoss
  }
  return styles.hpZero
}

const styles = StyleSheet.create({
  empty: {
    ...theme.type.body,
    color: theme.colors.textDim,
    textAlign: 'center',
  },
  card: { gap: theme.spacing(2) },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  date: {
    ...theme.type.label,
    color: theme.colors.textDim,
  },
  outcomeRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing(2) },
  dot: { width: 8, height: 8 },
  outcome: {
    ...theme.type.body,
    color: theme.colors.text,
  },
  times: {
    ...theme.type.label,
    color: theme.colors.text,
  },
  score: {
    ...theme.type.body,
    color: theme.colors.gold,
  },
  hp: { ...theme.type.body },
  hpGain: { color: theme.colors.leaf },
  hpLoss: { color: theme.colors.heartFull },
  hpZero: { color: theme.colors.textDim },
})
