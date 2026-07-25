import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { LUMA } from '../../assets/manifest'
import type { SleepRecommendation } from '../contracts/aiOnboarding'
import { ChatInputRow, DialogueText, SlotButton, SpriteButton } from './LumaTavernControls'
import {
  fitFont,
  LUMA_FONT,
  rectStyle,
  S1_PARCHMENT,
  S1_SLOTS,
  S2_ACCEPT,
  S2_ADJUST,
  S2_PARCHMENT,
  S2_STRIP,
  stageFont,
  type StageSize,
} from './lumaTavernLayout'
import { strings } from './strings'
import { tavernColors } from './tavern'
import { theme } from './theme'
import { formatClock } from './window'

/** Welcome: greeting on the parchment, SIT WITH LUMA / SET IT MYSELF slots. */
export function LumaWelcomeOverlay({
  stage,
  onStart,
  onManual,
}: {
  stage: StageSize
  onStart: () => void
  onManual: () => void
}) {
  return (
    <>
      <DialogueText rect={S1_PARCHMENT} stage={stage} text={strings.oracle_welcome_body} />
      <SlotButton rect={S1_SLOTS[0]} stage={stage} label={strings.oracle_start} onPress={onStart} />
      <SlotButton
        rect={S1_SLOTS[1]}
        stage={stage}
        label={strings.oracle_set_manually}
        onPress={onManual}
      />
    </>
  )
}

/** Chat: Luma's words, up to two tap-to-answer slots, and the input row. */
export function LumaChatOverlay({
  stage,
  text,
  suggestions,
  loading,
  onSend,
}: {
  stage: StageSize
  text: string
  suggestions: readonly string[]
  loading: boolean
  onSend: (text: string) => void
}) {
  return (
    <>
      <DialogueText
        rect={S1_PARCHMENT}
        stage={stage}
        text={loading ? strings.oracle_thinking : text}
      />
      {!loading &&
        suggestions
          .slice(0, 2)
          .map((suggestion, i) => (
            <SlotButton
              key={suggestion}
              rect={S1_SLOTS[i]}
              stage={stage}
              label={suggestion}
              onPress={() => onSend(suggestion)}
            />
          ))}
      {!loading && <ChatInputRow stage={stage} disabled={loading} onSend={onSend} />}
    </>
  )
}

/** Result: closing words, the window strip, ACCEPT / ADJUST sprite buttons. */
export function LumaResultOverlay({
  stage,
  recommendation,
  message,
  onAccept,
  onAdjust,
}: {
  stage: StageSize
  recommendation: SleepRecommendation
  message: string
  onAccept: () => void
  onAdjust: () => void
}) {
  const strip = `${strings.oracle_window_strip} ${formatClock(recommendation.bedMin)} - ${formatClock(recommendation.wakeMin)}`
  const stripFont = stageFont(stage, fitFont(strip, LUMA_FONT.strip, LUMA_FONT.stripMaxWidth))
  const parchment = recommendation.reason ? `${message}\n\n${recommendation.reason}` : message
  return (
    <>
      <DialogueText rect={S2_PARCHMENT} stage={stage} text={parchment} />
      <View style={[rectStyle(S2_STRIP, stage), styles.strip]}>
        <Text style={[styles.stripText, { fontSize: stripFont, lineHeight: stripFont * 1.3 }]}>
          {strip}
        </Text>
      </View>
      <SpriteButton
        rect={S2_ACCEPT}
        stage={stage}
        up={LUMA.btn_accept}
        down={LUMA.btn_accept_down}
        onPress={onAccept}
        a11yLabel={strings.oracle_accept}
      />
      <SpriteButton
        rect={S2_ADJUST}
        stage={stage}
        up={LUMA.btn_adjust}
        down={LUMA.btn_adjust_down}
        onPress={onAdjust}
        a11yLabel={strings.oracle_adjust}
      />
    </>
  )
}

/** Error: quiet-stars message with TRY AGAIN / SET IT MYSELF slots. */
export function LumaErrorOverlay({
  stage,
  onRetry,
  onManual,
}: {
  stage: StageSize
  onRetry: () => void
  onManual: () => void
}) {
  const text = `${strings.oracle_error_title}. ${strings.oracle_error_body}`
  return (
    <>
      <DialogueText rect={S1_PARCHMENT} stage={stage} text={text} />
      <SlotButton rect={S1_SLOTS[0]} stage={stage} label={strings.oracle_retry} onPress={onRetry} />
      <SlotButton
        rect={S1_SLOTS[1]}
        stage={stage}
        label={strings.oracle_set_manually}
        onPress={onManual}
      />
    </>
  )
}

const styles = StyleSheet.create({
  strip: { alignItems: 'center', justifyContent: 'center' },
  stripText: {
    fontFamily: theme.fontFamily,
    color: tavernColors.gold,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
})
