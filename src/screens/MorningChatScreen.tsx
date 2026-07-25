import { useRouter } from 'expo-router'
import React, { useEffect, useMemo, useState } from 'react'
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

import type { MorningContext } from '../systems/aiMorningChat'
import { MorningChatOverlay, MorningErrorOverlay } from '../ui/LumaMorningOverlays'
import { LumaTavernScene } from '../ui/LumaTavernScene'
import { fitStage, type StageSize } from '../ui/lumaTavernLayout'
import { strings } from '../ui/strings'
import { theme } from '../ui/theme'
import { useGame } from '../ui/useGame'
import { useMorningChat, type MorningChatState } from '../ui/useMorningChat'
import { useTypewriter } from '../ui/useTypewriter'

function useMorningContext(): MorningContext {
  const { lastEvaluation } = useGame()
  return useMemo(
    () => ({
      outcome: lastEvaluation?.outcome ?? 'GOOD',
      hpDelta: lastEvaluation?.hpDelta ?? 0,
      xp: lastEvaluation?.xp ?? 0,
    }),
    [lastEvaluation],
  )
}

/** Luma's latest line — or what she is busy with while a reply is in flight. */
function dialogueFor(state: MorningChatState, busy: boolean): string {
  if (busy) {
    return state.messages.length === 0
      ? strings.morning_chat_greeting_loading
      : strings.oracle_thinking
  }
  return [...state.messages].reverse().find((message) => message.role === 'oracle')?.text ?? ''
}

/**
 * Morning reflection with Luma in the hand-drawn tavern, matching the
 * first-run chat: the 9:16 stage letterboxes into the free space; dialogue,
 * the inline input row and the exit slot sit on the baked areas of the
 * artwork, and the stage lifts above the keyboard while typing.
 */
export function MorningChatScreen() {
  const router = useRouter()
  const chat = useMorningChat(useMorningContext())
  const [stage, setStage] = useState<StageSize | null>(null)

  useEffect(() => {
    chat.start()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const busy = chat.state.loading || chat.state.phase === 'greeting'
  const raw = dialogueFor(chat.state, busy)
  const typed = useTypewriter(raw, !busy)
  const goHome = () => router.dismissTo('/')

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
            {stage ? (
              <View style={{ width: stage.width, height: stage.height }}>
                <LumaTavernScene variant="morning" speaking={!busy && !typed.done} stage={stage} />
                {chat.state.phase === 'error' ? (
                  <MorningErrorOverlay stage={stage} onRetry={chat.retry} onDone={goHome} />
                ) : (
                  <MorningChatOverlay
                    stage={stage}
                    text={typed.shown}
                    showDone={chat.state.messages.some((m) => m.role === 'oracle')}
                    loading={busy}
                    onSend={chat.send}
                    onDone={goHome}
                  />
                )}
              </View>
            ) : null}
          </View>
        </KeyboardAvoidingView>
        <Pressable accessibilityRole="button" onPress={goHome} hitSlop={10} style={styles.skip}>
          <Text style={styles.skipText}>{strings.morning_chat_skip}</Text>
        </Pressable>
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
