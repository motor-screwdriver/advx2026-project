import React, { useEffect, useRef, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'

import { Nameplate } from './OraclePanels'
import { PixelButton } from './PixelButton'
import { PixelPanel } from './PixelPanel'
import { strings } from './strings'
import { theme } from './theme'
import { MAX_INPUT_CHARS, type OracleTranscriptMessage } from './useOracleChat'
import { useVoiceInput } from './useVoiceInput'

function Transcript({ messages }: { messages: readonly OracleTranscriptMessage[] }) {
  const scroll = useRef<ScrollView>(null)
  useEffect(() => {
    scroll.current?.scrollToEnd({ animated: true })
  }, [messages])
  return (
    <ScrollView
      ref={scroll}
      style={styles.transcript}
      contentContainerStyle={styles.transcriptContent}
      showsVerticalScrollIndicator={false}
      accessibilityLabel="Conversation with Luma"
    >
      {messages.map((message) => (
        <View
          key={message.id}
          style={[styles.message, message.role === 'user' && styles.userMessage]}
        >
          <Text style={styles.speaker}>
            {message.role === 'oracle' ? strings.oracle_name : strings.oracle_you}
          </Text>
          <Text style={[styles.messageText, message.role === 'user' && styles.userText]}>
            {message.text}
          </Text>
        </View>
      ))}
    </ScrollView>
  )
}

function SuggestionChips({
  suggestions,
  onPick,
}: {
  suggestions: readonly string[]
  onPick: (text: string) => void
}) {
  if (suggestions.length === 0) {
    return null
  }
  return (
    <View style={styles.chips}>
      {suggestions.map((suggestion) => (
        <Pressable
          key={suggestion}
          accessibilityRole="button"
          style={styles.chip}
          onPress={() => onPick(suggestion)}
        >
          <Text style={styles.chipText}>{suggestion}</Text>
        </Pressable>
      ))}
    </View>
  )
}

function InputRow({ onSend }: { onSend: (text: string) => void }) {
  const [draft, setDraft] = useState('')
  const voice = useVoiceInput((text) => setDraft((prev) => (prev ? `${prev} ${text}` : text)))
  const submit = () => {
    if (draft.trim()) {
      onSend(draft)
      setDraft('')
    }
  }
  return (
    <View style={styles.inputRow}>
      <TextInput
        style={styles.input}
        value={draft}
        onChangeText={setDraft}
        placeholder={voice.listening ? strings.oracle_listening : strings.oracle_input_placeholder}
        placeholderTextColor={theme.colors.textDim}
        multiline
        maxLength={MAX_INPUT_CHARS}
        onSubmitEditing={submit}
        blurOnSubmit
        accessibilityLabel={strings.oracle_input_placeholder}
      />
      {voice.supported && (
        <PixelButton
          compact
          label={voice.listening ? strings.oracle_mic_stop : strings.oracle_mic}
          onPress={voice.toggle}
        />
      )}
      <PixelButton compact label={strings.oracle_send} disabled={!draft.trim()} onPress={submit} />
    </View>
  )
}

export function OracleChatPanel({
  messages,
  suggestions,
  loading,
  onSend,
}: {
  messages: readonly OracleTranscriptMessage[]
  suggestions: readonly string[]
  loading: boolean
  onSend: (text: string) => void
}) {
  return (
    <PixelPanel contentStyle={styles.panel}>
      <Nameplate />
      <Transcript messages={messages} />
      {loading ? (
        <View style={styles.thinking}>
          <View style={styles.thinkingPixel} />
          <View style={styles.thinkingPixel} />
          <View style={styles.thinkingPixel} />
          <Text style={styles.thinkingText}>{strings.oracle_thinking}</Text>
        </View>
      ) : (
        <View style={styles.reply}>
          <SuggestionChips suggestions={suggestions} onPick={onSend} />
          <InputRow onSend={onSend} />
        </View>
      )}
    </PixelPanel>
  )
}

const styles = StyleSheet.create({
  panel: { gap: theme.spacing(2), paddingVertical: theme.spacing(3) },
  transcript: { maxHeight: 168 },
  transcriptContent: { gap: theme.spacing(2), paddingVertical: theme.spacing(1) },
  message: { maxWidth: '92%', gap: 2 },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.inset,
    borderRadius: theme.borderRadius,
    paddingHorizontal: theme.spacing(2),
    paddingVertical: theme.spacing(1),
  },
  speaker: { ...theme.type.label, color: theme.colors.gold, textTransform: 'uppercase' },
  messageText: { ...theme.type.body, color: theme.colors.text },
  userText: { color: theme.colors.textDim },
  reply: { gap: theme.spacing(2) },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing(1) },
  chip: {
    backgroundColor: theme.colors.inset,
    borderWidth: theme.borderWidth,
    borderColor: theme.colors.bevelLight,
    borderRadius: theme.borderRadius,
    paddingHorizontal: theme.spacing(2),
    paddingVertical: theme.spacing(1),
  },
  chipText: { ...theme.type.label, color: theme.colors.text },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: theme.spacing(1) },
  input: {
    ...theme.type.label,
    flex: 1,
    minHeight: 40,
    maxHeight: 88,
    color: theme.colors.text,
    backgroundColor: theme.colors.inset,
    borderWidth: theme.borderWidth,
    borderColor: theme.colors.bevelLight,
    borderRadius: theme.borderRadius,
    paddingHorizontal: theme.spacing(2),
    paddingVertical: theme.spacing(2),
    textAlignVertical: 'center',
  },
  thinking: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: theme.spacing(1) },
  thinkingPixel: { width: 5, height: 5, backgroundColor: theme.colors.gold },
  thinkingText: { ...theme.type.label, color: theme.colors.textDim, marginLeft: theme.spacing(1) },
})
