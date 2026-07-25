import React, { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import type { CachedSleepPlan } from '../state/mifitStore'
import { strings } from '../ui/strings'
import { GoldButton, Parchment, WoodPanel } from '../ui/tavern'
import { theme } from '../ui/theme'

export function SleepPlanResult({ plan, onDone }: { plan: CachedSleepPlan; onDone: () => void }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <View style={styles.wrap}>
      <LumaBubble message={plan.lumaMessage} />
      {plan.plan && (
        <PlanCard plan={plan.plan} expanded={expanded} onToggle={() => setExpanded(!expanded)} />
      )}
      {plan.stats && expanded && <StatsCard stats={plan.stats} />}
      <GoldButton label={strings.sleep_plan_done} onPress={onDone} />
    </View>
  )
}

function LumaBubble({ message }: { message: string }) {
  return (
    <WoodPanel contentStyle={styles.lumaBubble}>
      <Text style={styles.lumaName}>{strings.oracle_name}</Text>
      <Text style={styles.lumaMessage}>{message}</Text>
    </WoodPanel>
  )
}

function PlanCard({
  plan,
  expanded,
  onToggle,
}: {
  plan: NonNullable<CachedSleepPlan['plan']>
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <Parchment>
      <View style={styles.timesRow}>
        <TimeBlock label={strings.sleep_plan_bedtime} time={plan.bedTime} />
        <Text style={styles.timeSep}>{'\u2192'}</Text>
        <TimeBlock label={strings.sleep_plan_waketime} time={plan.wakeTime} />
      </View>
      <Pressable onPress={onToggle} hitSlop={8}>
        <Text style={styles.expandToggle}>
          {expanded ? strings.sleep_plan_collapse : strings.sleep_plan_expand}
        </Text>
      </Pressable>
      {expanded && <ExpandedPlan plan={plan} />}
    </Parchment>
  )
}

function ExpandedPlan({ plan }: { plan: NonNullable<CachedSleepPlan['plan']> }) {
  return (
    <View style={styles.expandedContent}>
      <Text style={styles.sectionTitle}>{strings.sleep_plan_ritual_title}</Text>
      {plan.ritualSteps.map((step, i) => (
        <View key={i} style={styles.stepRow}>
          <Text style={styles.stepBullet}>{i + 1}.</Text>
          <Text style={styles.stepText}>{step}</Text>
        </View>
      ))}
      {plan.reason ? (
        <>
          <Text style={styles.sectionTitle}>{strings.sleep_plan_reason_title}</Text>
          <Text style={styles.reasonText}>{plan.reason}</Text>
        </>
      ) : null}
    </View>
  )
}

function StatsCard({ stats }: { stats: NonNullable<CachedSleepPlan['stats']> }) {
  return (
    <WoodPanel contentStyle={styles.statsPanel}>
      <Text style={styles.sectionTitle}>{strings.sleep_plan_stats_title}</Text>
      <View style={styles.statsGrid}>
        <StatChip value={String(stats.totalNights)} label={strings.sleep_plan_nights} />
        <StatChip
          value={`${Math.floor(stats.avgDurationMin / 60)}h ${stats.avgDurationMin % 60}m`}
          label={strings.sleep_plan_avg_duration}
        />
        <StatChip value={`${stats.consistencyScore}%`} label={strings.sleep_plan_consistency} />
      </View>
    </WoodPanel>
  )
}

function TimeBlock({ label, time }: { label: string; time: string }) {
  return (
    <View style={styles.timeBlock}>
      <Text style={styles.timeLabel}>{label}</Text>
      <Text style={styles.timeValue}>{time}</Text>
    </View>
  )
}

function StatChip({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.statChip}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: theme.spacing(3) },
  lumaBubble: { gap: theme.spacing(1) },
  lumaName: { ...theme.type.label, color: theme.colors.gold, textTransform: 'uppercase' },
  lumaMessage: { ...theme.type.body, color: theme.colors.text, lineHeight: 22 },
  timesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing(3),
  },
  timeSep: { ...theme.type.body, color: theme.colors.textDim, fontSize: 20 },
  timeBlock: { alignItems: 'center', gap: theme.spacing(1) },
  timeLabel: {
    ...theme.type.label,
    color: theme.colors.textDim,
    textTransform: 'uppercase',
    fontSize: 11,
  },
  timeValue: { fontFamily: theme.fontFamily, fontSize: 28, color: theme.colors.text },
  expandToggle: {
    ...theme.type.label,
    color: theme.colors.gold,
    textAlign: 'center',
    paddingVertical: theme.spacing(2),
  },
  expandedContent: { gap: theme.spacing(2), paddingTop: theme.spacing(1) },
  sectionTitle: {
    ...theme.type.label,
    color: theme.colors.text,
    textTransform: 'uppercase',
    fontSize: 11,
  },
  stepRow: { flexDirection: 'row', gap: theme.spacing(2), paddingLeft: theme.spacing(1) },
  stepBullet: { ...theme.type.body, color: theme.colors.gold, minWidth: 18 },
  stepText: { ...theme.type.body, color: theme.colors.text, flex: 1, lineHeight: 20 },
  reasonText: { ...theme.type.body, color: theme.colors.textDim, lineHeight: 20 },
  statsPanel: { gap: theme.spacing(2) },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  statChip: { alignItems: 'center', gap: theme.spacing(0.5) },
  statValue: { fontFamily: theme.fontFamily, fontSize: 18, color: theme.colors.text },
  statLabel: {
    ...theme.type.label,
    color: theme.colors.textDim,
    fontSize: 10,
    textTransform: 'uppercase',
  },
})
