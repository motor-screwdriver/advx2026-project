import React, { useEffect, useRef, useState } from 'react'
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'

import { LUMA } from '../../assets/manifest'
import {
  fitFont,
  LUMA_FONT,
  rectStyle,
  S1_INPUT,
  S1_SEND,
  S1_SLOTS,
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

/** Answer button baked into one of the two slots of the question scene. */
export function SlotButton({
  index,
  stage,
  label,
  onPress,
}: {
  index: number
  stage: StageSize
  label: string
  onPress: () => void
}) {
  return (
    <SpriteButton
      rect={S1_SLOTS[index]}
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

/** Scrollable ink text over the parchment area; follows the typewriter. */
export function DialogueText({
  rect,
  stage,
  text,
}: {
  rect: FracRect
  stage: StageSize
  text: string
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
  const fontSize = stageFont(stage, parchmentFont(text.length))
  return (
    <View style={rectStyle(rect, stage)}>
      <ScrollView ref={scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.dialogue, { fontSize, lineHeight: fontSize * 1.55 }]}>{text}</Text>
      </ScrollView>
    </View>
  )
}

/** Single-line chat input on the baked field plus the paper-plane send tile. */
export function ChatInputRow({
  stage,
  disabled,
  onSend,
}: {
  stage: StageSize
  disabled: boolean
  onSend: (text: string) => void
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
  const fontSize = stageFont(stage, LUMA_FONT.input)
  return (
    <>
      <TextInput
        style={[rectStyle(S1_INPUT, stage), styles.input, { fontSize }]}
        value={draft}
        onChangeText={setDraft}
        placeholder={strings.oracle_input_placeholder}
        placeholderTextColor="#8a6f52"
        maxLength={MAX_INPUT_CHARS}
        returnKeyType="send"
        onSubmitEditing={submit}
        blurOnSubmit={false}
        editable={!disabled}
        accessibilityLabel={strings.oracle_input_placeholder}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={strings.oracle_send}
        onPress={submit}
        disabled={!ready}
        style={rectStyle(S1_SEND, stage)}
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
  input: {
    fontFamily: theme.fontFamily,
    color: theme.colors.text,
    padding: 0,
  },
  sendTouch: { flex: 1 },
  sendPressed: { backgroundColor: '#00000055' },
})
