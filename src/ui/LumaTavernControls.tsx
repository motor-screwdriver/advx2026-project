import React, { useEffect, useRef, useState } from 'react'
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'

import { LUMA } from '../../assets/manifest'
import {
  fitFont,
  fitParagraph,
  LUMA_FONT,
  rectStyle,
  S1_INPUT,
  S1_SEND,
  stageFont,
  type FracRect,
  type StageSize,
} from './lumaTavernLayout'
import { strings } from './strings'
import { tavernColors } from './tavern'
import { theme } from './theme'
import { MAX_INPUT_CHARS } from './useOracleChat'

interface SpriteEntryLike {
  readonly source: number
}

/** Wood-bar sprite button; swaps to the pressed sprite while held. */
export function SpriteButton({
  rect,
  stage,
  up,
  down,
  onPress,
  label,
  a11yLabel,
  fontSourcePx = LUMA_FONT.slot,
  maxSourcePx = LUMA_FONT.slotMaxWidth,
}: {
  rect: FracRect
  stage: StageSize
  up: SpriteEntryLike
  down: SpriteEntryLike
  onPress: () => void
  label?: string
  a11yLabel?: string
  fontSourcePx?: number
  maxSourcePx?: number
}) {
  const fontSize = label
    ? stageFont(stage, fitFont(label, fontSourcePx, maxSourcePx))
    : fontSourcePx
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11yLabel ?? label}
      onPress={onPress}
      style={rectStyle(rect, stage)}
    >
      {({ pressed }) => (
        <View style={styles.btnInner}>
          <Image
            source={pressed ? down.source : up.source}
            resizeMode="stretch"
            fadeDuration={0}
            style={styles.btnImage}
          />
          {label ? (
            <Text
              style={[styles.btnLabel, { fontSize, lineHeight: fontSize * 1.4 }]}
              numberOfLines={1}
            >
              {label}
            </Text>
          ) : null}
        </View>
      )}
    </Pressable>
  )
}

/** Answer button on one of the empty wood slots of a scene. */
export function SlotButton({
  rect,
  stage,
  label,
  onPress,
}: {
  rect: FracRect
  stage: StageSize
  label: string
  onPress: () => void
}) {
  return (
    <SpriteButton
      rect={rect}
      stage={stage}
      up={LUMA.btn_empty}
      down={LUMA.btn_empty_down}
      onPress={onPress}
      label={label}
    />
  )
}

/** Tiered font so long oracle messages still start readable, then scroll. */
function parchmentFont(length: number): number {
  if (length <= 60) {
    return LUMA_FONT.parchment
  }
  if (length <= 110) {
    return 128
  }
  if (length <= 170) {
    return 112
  }
  return 100
}

const FIT_LINE_HEIGHT = 1.45
const TIER_LINE_HEIGHT = 1.55

/**
 * Scrollable ink text over the parchment area; follows the typewriter. With
 * `fit` the size is chosen so the whole message shows at once (long morning
 * talk), otherwise it steps down through tiers and scrolls.
 */
export function DialogueText({
  rect,
  stage,
  text,
  fit = false,
}: {
  rect: FracRect
  stage: StageSize
  text: string
  fit?: boolean
}) {
  const scroll = useRef<ScrollView>(null)
  const previous = useRef('')
  useEffect(() => {
    // Typewriter appends -> follow the tail; a new text -> read from the top.
    const appended =
      previous.current.length > 0 &&
      text.startsWith(previous.current) &&
      text.length > previous.current.length
    previous.current = text
    if (appended) {
      scroll.current?.scrollToEnd({ animated: false })
    } else {
      scroll.current?.scrollTo({ y: 0, animated: false })
    }
  }, [text])
  const lineHeight = fit ? FIT_LINE_HEIGHT : TIER_LINE_HEIGHT
  const sourcePx = fit
    ? fitParagraph(text, rect, LUMA_FONT.parchment, LUMA_FONT.parchmentMin, lineHeight)
    : parchmentFont(text.length)
  const fontSize = stageFont(stage, sourcePx)
  return (
    <View style={rectStyle(rect, stage)}>
      <ScrollView
        ref={scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={fit ? styles.fitted : undefined}
      >
        <Text style={[styles.dialogue, { fontSize, lineHeight: fontSize * lineHeight }]}>
          {text}
        </Text>
      </ScrollView>
    </View>
  )
}

/** Single-line chat input on a baked field plus the send tile; morning chat passes its own rects. */
export function ChatInputRow({
  stage,
  disabled,
  onSend,
  inputRect = S1_INPUT,
  sendRect = S1_SEND,
  fontSourcePx = LUMA_FONT.input,
  placeholder = strings.oracle_input_placeholder,
}: {
  stage: StageSize
  disabled: boolean
  onSend: (text: string) => void
  inputRect?: FracRect
  sendRect?: FracRect
  fontSourcePx?: number
  placeholder?: string
}) {
  const [draft, setDraft] = useState('')
  const ready = draft.trim().length > 0 && !disabled
  const submit = () => {
    if (!ready) {
      return
    }
    onSend(draft)
    setDraft('')
  }
  const fontSize = stageFont(stage, fontSourcePx)
  return (
    <>
      <TextInput
        style={[rectStyle(inputRect, stage), styles.input, { fontSize }]}
        value={draft}
        onChangeText={setDraft}
        placeholder={placeholder}
        placeholderTextColor="#8a6f52"
        maxLength={MAX_INPUT_CHARS}
        returnKeyType="send"
        onSubmitEditing={submit}
        blurOnSubmit={false}
        editable={!disabled}
        accessibilityLabel={placeholder}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={strings.oracle_send}
        onPress={submit}
        disabled={!ready}
        style={rectStyle(sendRect, stage)}
      >
        {({ pressed }) => <View style={[styles.sendTouch, pressed && styles.sendPressed]} />}
      </Pressable>
    </>
  )
}

const styles = StyleSheet.create({
  btnInner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  btnImage: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  btnLabel: {
    fontFamily: theme.fontFamily,
    color: theme.colors.text,
    textAlign: 'center',
  },
  dialogue: {
    fontFamily: theme.fontFamily,
    color: tavernColors.inkOnParchment,
  },
  /** A message that fits sits centred on the parchment rather than hugging the top. */
  fitted: { flexGrow: 1, justifyContent: 'center' },
  input: {
    fontFamily: theme.fontFamily,
    color: theme.colors.text,
    padding: 0,
  },
  sendTouch: { flex: 1 },
  sendPressed: { backgroundColor: '#00000055' },
})
