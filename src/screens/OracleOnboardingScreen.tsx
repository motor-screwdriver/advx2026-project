import { useRouter } from 'expo-router'
import React from 'react'
import {
  KeyboardAvoidingView,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import type { SleepRecommendation } from '../contracts/aiOnboarding'
import { DayNightBackground } from '../ui/DayNightBackground'
import { OracleChatPanel } from '../ui/OracleChatPanel'
import { OracleErrorPanel, OracleResultPanel, OracleWelcomePanel } from '../ui/OraclePanels'
import { OracleStage } from '../ui/OracleStage'
import { strings } from '../ui/strings'
import { theme } from '../ui/theme'
import { useGame } from '../ui/useGame'
import { useOracleChat } from '../ui/useOracleChat'

function TopBar({ hidden, onSkip }: { hidden: boolean; onSkip: () => void }) {
  return (
    <View style={styles.topBar}>
      <Text style={styles.topLabel}>{strings.oracle_top_label}</Text>
      {!hidden && (
        <Pressable accessibilityRole="button" onPress={onSkip} hitSlop={10}>
          <Text style={styles.skip}>{strings.oracle_skip}</Text>
        </Pressable>
      )}
    </View>
  )
}

function useOracleActions(recommendation: SleepRecommendation | null) {
  const router = useRouter()
  const { completeOnboarding } = useGame()
  const manual = () => router.replace('/onboarding')
  const adjust = () => {
    if (!recommendation) {
      return
    }
    router.push({
      pathname: '/onboarding',
      params: {
        source: 'oracle',
        bedMin: String(recommendation.bedMin),
        wakeMin: String(recommendation.wakeMin),
      },
    })
  }
  const accept = () => {
    if (!recommendation) {
      return
    }
    completeOnboarding(recommendation)
    router.replace('/')
  }
  return { manual, adjust, accept }
}

export function OracleOnboardingScreen() {
  const { height } = useWindowDimensions()
  const { state, start, send, retry } = useOracleChat()
  const { manual, adjust, accept } = useOracleActions(state.recommendation)
  const compact = height < 700
  const lastOracleText = [...state.messages].reverse().find((m) => m.role === 'oracle')?.text ?? ''
  return (
    <View style={styles.screen}>
      <DayNightBackground phase="night" />
      <View pointerEvents="none" style={styles.scrim} />
      <SafeAreaView style={[styles.safe, compact && styles.safeCompact]}>
        <KeyboardAvoidingView style={styles.avoider}>
          <TopBar hidden={state.phase === 'result'} onSkip={manual} />
          <OracleStage thinking={state.loading} compact={compact} />
          <View style={styles.panelWrap}>
            {state.phase === 'welcome' && <OracleWelcomePanel onStart={start} onManual={manual} />}
            {state.phase === 'chat' && (
              <OracleChatPanel
                messages={state.messages}
                suggestions={state.suggestions}
                loading={state.loading}
                onSend={send}
              />
            )}
            {state.phase === 'error' && <OracleErrorPanel onRetry={retry} onManual={manual} />}
            {state.phase === 'result' && state.recommendation && (
              <OracleResultPanel
                recommendation={state.recommendation}
                message={lastOracleText}
                onAccept={accept}
                onAdjust={adjust}
              />
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.bg },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: '#0a082044' },
  safe: { flex: 1, padding: theme.spacing(4) },
  safeCompact: { paddingVertical: theme.spacing(2) },
  avoider: { flex: 1, gap: theme.spacing(2), justifyContent: 'flex-start' },
  topBar: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topLabel: { ...theme.type.label, color: theme.colors.textDim, textTransform: 'uppercase' },
  skip: { ...theme.type.label, color: theme.colors.textDim, padding: theme.spacing(2) },
  panelWrap: { width: '100%', maxWidth: 520, alignSelf: 'center' },
})
