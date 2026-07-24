import { useRouter } from 'expo-router'
import React, { useEffect, useMemo } from 'react'
import {
  KeyboardAvoidingView,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import type { MorningContext } from '../systems/aiMorningChat'
import { DayNightBackground } from '../ui/DayNightBackground'
import { OracleChatPanel } from '../ui/OracleChatPanel'
import { OracleStage } from '../ui/OracleStage'
import { PixelButton } from '../ui/PixelButton'
import { strings } from '../ui/strings'
import { theme } from '../ui/theme'
import { useGame } from '../ui/useGame'
import { useMorningChat } from '../ui/useMorningChat'

function TopBar({ onSkip }: { onSkip: () => void }) {
  return (
    <View style={styles.topBar}>
      <Text style={styles.topLabel}>{strings.morning_chat_top_label}</Text>
      <Pressable accessibilityRole="button" onPress={onSkip} hitSlop={10}>
        <Text style={styles.skip}>{strings.morning_chat_skip}</Text>
      </Pressable>
    </View>
  )
}

function ErrorPanel({ onRetry, onSkip }: { onRetry: () => void; onSkip: () => void }) {
  return (
    <View style={styles.errorWrap}>
      <Text style={styles.errorTitle}>{strings.morning_chat_error_title}</Text>
      <Text style={styles.errorBody}>{strings.morning_chat_error_body}</Text>
      <PixelButton label={strings.oracle_retry} onPress={onRetry} />
      <Pressable accessibilityRole="button" onPress={onSkip} hitSlop={8}>
        <Text style={styles.skipAction}>{strings.morning_chat_skip}</Text>
      </Pressable>
    </View>
  )
}

export function MorningChatScreen() {
  const router = useRouter()
  const { height } = useWindowDimensions()
  const { lastEvaluation } = useGame()

  const context: MorningContext = useMemo(
    () => ({
      outcome: lastEvaluation?.outcome ?? 'GOOD',
      hpDelta: lastEvaluation?.hpDelta ?? 0,
      xp: lastEvaluation?.xp ?? 0,
    }),
    [lastEvaluation],
  )

  const { state, start, send, retry } = useMorningChat(context)
  const compact = height < 700

  // Auto-start conversation on mount
  useEffect(() => {
    start()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const goHome = () => router.dismissTo('/')
  const hasOracleReply = state.messages.some((m) => m.role === 'oracle')

  return (
    <View style={styles.screen}>
      <DayNightBackground phase="night" />
      <View pointerEvents="none" style={styles.scrim} />
      <SafeAreaView style={[styles.safe, compact && styles.safeCompact]}>
        <KeyboardAvoidingView style={styles.avoider}>
          <TopBar onSkip={goHome} />
          <OracleStage thinking={state.loading} compact={compact} />
          <View style={styles.panelWrap}>
            {state.phase === 'error' ? (
              <ErrorPanel onRetry={retry} onSkip={goHome} />
            ) : (
              <>
                <OracleChatPanel
                  messages={state.messages}
                  suggestions={state.suggestions}
                  loading={state.loading}
                  onSend={send}
                />
                {hasOracleReply && !state.loading && (
                  <PixelButton label={strings.morning_chat_done} onPress={goHome} />
                )}
              </>
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
  panelWrap: { width: '100%', maxWidth: 520, alignSelf: 'center', gap: theme.spacing(2) },
  errorWrap: { alignItems: 'center', gap: theme.spacing(2) },
  errorTitle: { ...theme.type.body, color: theme.colors.text, textAlign: 'center' },
  errorBody: { ...theme.type.body, color: theme.colors.textDim, textAlign: 'center' },
  skipAction: { ...theme.type.label, color: theme.colors.textDim, textAlign: 'center', padding: 4 },
})
