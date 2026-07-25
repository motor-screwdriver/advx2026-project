import React, { useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import type { SleepRecommendation } from '../contracts/aiOnboarding'
import {
  LumaChatOverlay,
  LumaErrorOverlay,
  LumaResultOverlay,
  LumaWelcomeOverlay,
} from '../ui/LumaTavernOverlays'
import { LumaTavernScene } from '../ui/LumaTavernScene'
import { fitStage, type StageSize } from '../ui/lumaTavernLayout'
import { useScreenTransition } from '../ui/screenTransition'
import { strings } from '../ui/strings'
import { theme } from '../ui/theme'
import { useGame } from '../ui/useGame'
import { useOracleChat } from '../ui/useOracleChat'
import { useTypewriter } from '../ui/useTypewriter'

function useOracleActions(recommendation: SleepRecommendation | null) {
  const go = useScreenTransition()
  const { completeOnboarding } = useGame()
  const manual = () => go('/onboarding', { replace: true })
  const adjust = () => {
    if (!recommendation) {
      return
    }
    go('/onboarding', {
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
    go('/tutorial', { replace: true })
  }
  return { manual, adjust, accept }
}

interface TavernOverlayProps {
  stage: StageSize
  state: ReturnType<typeof useOracleChat>['state']
  text: string
  start: () => void
  send: (text: string) => void
  retry: () => void
  manual: () => void
  adjust: () => void
  accept: () => void
}

/** Phase-dependent content layered over the baked areas of the artwork. */
function TavernOverlay(props: TavernOverlayProps) {
  const { stage, state } = props
  if (state.phase === 'welcome') {
    return <LumaWelcomeOverlay stage={stage} onStart={props.start} onManual={props.manual} />
  }
  if (state.phase === 'chat') {
    return (
      <LumaChatOverlay
        stage={stage}
        text={props.text}
        suggestions={state.suggestions}
        loading={state.loading}
        onSend={props.send}
      />
    )
  }
  if (state.phase === 'error') {
    return <LumaErrorOverlay stage={stage} onRetry={props.retry} onManual={props.manual} />
  }
  if (state.phase === 'result' && state.recommendation) {
    return (
      <LumaResultOverlay
        stage={stage}
        recommendation={state.recommendation}
        message={props.text}
        onAccept={props.accept}
        onAdjust={props.adjust}
      />
    )
  }
  return null
}

/**
 * First-run chat with Luma inside the hand-drawn Hearthlight Tavern scene.
 * The 9:16 stage letterboxes into the free space; dialogue, answer slots and
 * the input row sit exactly on the baked areas of the artwork.
 */
export function OracleOnboardingScreen() {
  const { state, start, send, retry } = useOracleChat()
  const { manual, adjust, accept } = useOracleActions(state.recommendation)
  const [stage, setStage] = useState<StageSize | null>(null)
  const lastOracleText = [...state.messages].reverse().find((m) => m.role === 'oracle')?.text ?? ''
  const rawText = state.loading ? strings.oracle_thinking : lastOracleText
  const typed = useTypewriter(rawText, state.phase !== 'welcome' && !state.loading)
  const speaking = !state.loading && !typed.done

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout
    setStage(fitStage(width, height))
  }

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={styles.avoider}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.center} onLayout={onLayout}>
            {stage && (
              <View style={{ width: stage.width, height: stage.height }}>
                <LumaTavernScene
                  variant={
                    state.phase === 'result'
                      ? 'result'
                      : state.phase === 'welcome'
                        ? 'welcome'
                        : 'question'
                  }
                  speaking={speaking}
                  stage={stage}
                />
                <TavernOverlay
                  stage={stage}
                  state={state}
                  text={typed.shown}
                  start={start}
                  send={send}
                  retry={retry}
                  manual={manual}
                  adjust={adjust}
                  accept={accept}
                />
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
        {state.phase !== 'result' && (
          <Pressable accessibilityRole="button" onPress={manual} hitSlop={10} style={styles.skip}>
            <Text style={styles.skipText}>{strings.oracle_skip}</Text>
          </Pressable>
        )}
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#150d08' },
  safe: { flex: 1 },
  avoider: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  skip: {
    position: 'absolute',
    top: theme.spacing(2),
    right: theme.spacing(3),
    padding: theme.spacing(2),
  },
  skipText: {
    ...theme.type.label,
    color: theme.colors.textDim,
    textTransform: 'uppercase',
    textShadowColor: '#000000',
    textShadowRadius: 3,
  },
})
