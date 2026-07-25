import React from 'react'

import { ChatInputRow, DialogueText, SlotButton } from './LumaTavernControls'
import {
  LUMA_FONT,
  MORNING_INPUT,
  MORNING_PARCHMENT,
  MORNING_SEND,
  MORNING_SLOTS,
  type StageSize,
} from './lumaTavernLayout'
import { strings } from './strings'

/**
 * Content layered over the baked areas of the morning artwork: Luma's words on
 * the parchment, the inline chat input row (same widget as the first-run chat),
 * and one exit slot on the free wood below. No canned answers — the player
 * types every reply.
 */

export function MorningChatOverlay({
  stage,
  text,
  showDone,
  loading,
  onSend,
  onDone,
}: {
  stage: StageSize
  text: string
  showDone: boolean
  loading: boolean
  onSend: (text: string) => void
  onDone: () => void
}) {
  return (
    <>
      <DialogueText fit rect={MORNING_PARCHMENT} stage={stage} text={text} />
      {!loading && (
        <ChatInputRow
          stage={stage}
          disabled={loading}
          onSend={onSend}
          inputRect={MORNING_INPUT}
          sendRect={MORNING_SEND}
          fontSourcePx={LUMA_FONT.morningInput}
          placeholder={strings.morning_chat_input_hint}
        />
      )}
      {!loading && showDone ? (
        <SlotButton
          rect={MORNING_SLOTS[0]}
          stage={stage}
          label={strings.morning_chat_done}
          onPress={onDone}
        />
      ) : null}
    </>
  )
}

export function MorningErrorOverlay({
  stage,
  onRetry,
  onDone,
}: {
  stage: StageSize
  onRetry: () => void
  onDone: () => void
}) {
  const text = `${strings.morning_chat_error_title}. ${strings.morning_chat_error_body}`
  return (
    <>
      <DialogueText fit rect={MORNING_PARCHMENT} stage={stage} text={text} />
      <SlotButton
        rect={MORNING_SLOTS[0]}
        stage={stage}
        label={strings.oracle_retry}
        onPress={onRetry}
      />
      <SlotButton
        rect={MORNING_SLOTS[1]}
        stage={stage}
        label={strings.morning_chat_done}
        onPress={onDone}
      />
    </>
  )
}
