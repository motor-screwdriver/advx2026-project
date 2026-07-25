import { useRouter } from 'expo-router'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import type { CachedSleepPlan } from '../state/mifitStore'
import { useMiFitnessStore } from '../state/mifitStore'
import { loadMiFitnessSession } from '../systems/mifit'
import {
  fetchSleepPlan,
  isSleepPlanFresh,
  SleepPlanSessionExpiredError,
} from '../systems/sleepPlan'
import { DayNightBackground } from '../ui/DayNightBackground'
import { OracleStage } from '../ui/OracleStage'
import { strings } from '../ui/strings'
import { GoldButton, WoodButton } from '../ui/tavern'
import { theme } from '../ui/theme'
import { SleepPlanResult } from './SleepPlanResult'

type Phase = 'loading' | 'result' | 'error' | 'expired'

export function SleepPlanScreen() {
  const router = useRouter()
  const { sleepPlan, setSleepPlan } = useMiFitnessStore()
  const [phase, setPhase] = useState<Phase>(
    sleepPlan && isSleepPlanFresh(sleepPlan) ? 'result' : 'loading',
  )
  const [result, setResult] = useState<CachedSleepPlan | null>(sleepPlan)
  const fetchedRef = useRef(false)

  const doFetch = useCallback(async () => {
    setPhase('loading')
    try {
      const stored = await loadMiFitnessSession()
      if (!stored) {
        setPhase('expired')
        return
      }
      const plan = await fetchSleepPlan({ mifitSession: stored.session, region: stored.region })
      setResult(plan)
      setSleepPlan(plan)
      setPhase('result')
    } catch (err) {
      if (err instanceof SleepPlanSessionExpiredError) setPhase('expired')
      else {
        console.warn('[sleep-plan] fetch error', err)
        setPhase('error')
      }
    }
  }, [setSleepPlan])

  useEffect(() => {
    if (fetchedRef.current) return
    fetchedRef.current = true
    if (sleepPlan && isSleepPlanFresh(sleepPlan)) {
      setResult(sleepPlan)
      setPhase('result')
    } else {
      void doFetch()
    }
  }, [sleepPlan, doFetch])

  const goHome = () => router.dismissTo('/')
  const goSettings = () => router.push('/settings')

  return (
    <View style={styles.screen}>
      <DayNightBackground phase="night" />
      <View pointerEvents="none" style={styles.scrim} />
      <SafeAreaView style={styles.safe}>
        <TopBar onClose={goHome} />
        <OracleStage thinking={phase === 'loading'} compact />
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {phase === 'loading' && <LoadingState />}
          {phase === 'error' && <ErrorState onRetry={doFetch} onBack={goHome} />}
          {phase === 'expired' && <ExpiredState onReconnect={goSettings} onBack={goHome} />}
          {phase === 'result' && result && <SleepPlanResult plan={result} onDone={goHome} />}
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}

function TopBar({ onClose }: { onClose: () => void }) {
  return (
    <View style={styles.topBar}>
      <Text style={styles.topLabel}>{strings.sleep_plan_top_label}</Text>
      <Pressable accessibilityRole="button" onPress={onClose} hitSlop={10}>
        <Text style={styles.closeBtn}>{'\u2715'}</Text>
      </Pressable>
    </View>
  )
}

function LoadingState() {
  return (
    <View style={styles.centerWrap}>
      <Text style={styles.loadingText}>{strings.sleep_plan_loading}</Text>
    </View>
  )
}

function ErrorState({ onRetry, onBack }: { onRetry: () => void; onBack: () => void }) {
  return (
    <View style={styles.centerWrap}>
      <Text style={styles.errorTitle}>{strings.sleep_plan_error_title}</Text>
      <Text style={styles.errorBody}>{strings.sleep_plan_error_body}</Text>
      <GoldButton label={strings.sleep_plan_retry} onPress={onRetry} />
      <WoodButton label={strings.sleep_plan_done} onPress={onBack} />
    </View>
  )
}

function ExpiredState({ onReconnect, onBack }: { onReconnect: () => void; onBack: () => void }) {
  return (
    <View style={styles.centerWrap}>
      <Text style={styles.errorTitle}>{strings.sleep_plan_expired_title}</Text>
      <Text style={styles.errorBody}>{strings.sleep_plan_expired_body}</Text>
      <GoldButton label={strings.sleep_plan_reconnect} onPress={onReconnect} />
      <WoodButton label={strings.sleep_plan_done} onPress={onBack} />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.bg },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: '#0a082044' },
  safe: { flex: 1, padding: theme.spacing(4) },
  topBar: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topLabel: { ...theme.type.label, color: theme.colors.textDim, textTransform: 'uppercase' },
  closeBtn: {
    ...theme.type.label,
    color: theme.colors.textDim,
    fontSize: 18,
    padding: theme.spacing(2),
  },
  scroll: { flex: 1 },
  scrollContent: { gap: theme.spacing(3), paddingBottom: theme.spacing(4) },
  centerWrap: { alignItems: 'center', gap: theme.spacing(3), paddingTop: theme.spacing(4) },
  loadingText: { ...theme.type.body, color: theme.colors.textDim, textAlign: 'center' },
  errorTitle: {
    ...theme.type.body,
    color: theme.colors.text,
    textAlign: 'center',
    fontWeight: '600',
  },
  errorBody: { ...theme.type.body, color: theme.colors.textDim, textAlign: 'center' },
})
