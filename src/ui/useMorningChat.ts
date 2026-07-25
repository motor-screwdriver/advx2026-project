import React, { useCallback, useRef, useState } from 'react'

import type { ChatTurn } from '../contracts/aiOnboarding'
import { type MorningContext, requestMorningReply } from '../systems/aiMorningChat'
import type { OracleTranscriptMessage } from './useOracleChat'

export type MorningChatPhase = 'greeting' | 'chat' | 'error'

export interface MorningChatState {
  phase: MorningChatPhase
  messages: OracleTranscriptMessage[]
  suggestions: string[]
  loading: boolean
}

export { MAX_INPUT_CHARS } from './useOracleChat'

const INITIAL_STATE: MorningChatState = {
  phase: 'greeting',
  messages: [],
  suggestions: [],
  loading: false,
}

function toTurns(messages: readonly OracleTranscriptMessage[]): ChatTurn[] {
  return messages.map((message) => ({ role: message.role, text: message.text }))
}

async function fetchMorningReply(
  setState: React.Dispatch<React.SetStateAction<MorningChatState>>,
  messages: OracleTranscriptMessage[],
  context: MorningContext,
): Promise<void> {
  setState((state) => ({ ...state, phase: 'chat', messages, suggestions: [], loading: true }))
  try {
    const { reply } = await requestMorningReply(toTurns(messages), context)
    const oracleMessage: OracleTranscriptMessage = {
      id: `m${messages.length}`,
      role: 'oracle',
      text: reply.message,
    }
    setState({
      phase: 'chat',
      messages: [...messages, oracleMessage],
      suggestions: reply.suggestions,
      loading: false,
    })
  } catch {
    setState((state) => ({ ...state, phase: 'error', messages, loading: false }))
  }
}

export function useMorningChat(context: MorningContext) {
  const [state, setState] = useState(INITIAL_STATE)
  const contextRef = useRef(context)
  contextRef.current = context

  const start = useCallback(() => {
    if (!state.loading) {
      void fetchMorningReply(setState, [], contextRef.current)
    }
  }, [state.loading])

  const send = useCallback(
    (rawText: string) => {
      const text = rawText.trim().slice(0, 400)
      if (!text || state.loading || state.phase === 'error') {
        return
      }
      const userMessage: OracleTranscriptMessage = {
        id: `m${state.messages.length}`,
        role: 'user',
        text,
      }
      void fetchMorningReply(setState, [...state.messages, userMessage], contextRef.current)
    },
    [state.loading, state.messages, state.phase],
  )

  const retry = useCallback(() => {
    if (!state.loading) {
      void fetchMorningReply(setState, state.messages, contextRef.current)
    }
  }, [state.loading, state.messages])

  return { state, start, send, retry }
}
