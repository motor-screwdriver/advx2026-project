import { useCallback, useState } from 'react'

import type { ChatTurn, SleepRecommendation } from '../contracts/aiOnboarding'
import { requestOracleReply } from '../systems/aiOnboarding'

export type OraclePhase = 'welcome' | 'chat' | 'result' | 'error'

export interface OracleTranscriptMessage {
  id: string
  role: 'oracle' | 'user'
  text: string
}

export interface OracleChatState {
  phase: OraclePhase
  messages: OracleTranscriptMessage[]
  suggestions: string[]
  recommendation: SleepRecommendation | null
  loading: boolean
}

export const MAX_INPUT_CHARS = 400

const INITIAL_STATE: OracleChatState = {
  phase: 'welcome',
  messages: [],
  suggestions: [],
  recommendation: null,
  loading: false,
}

function toTurns(messages: readonly OracleTranscriptMessage[]): ChatTurn[] {
  return messages.map((message) => ({ role: message.role, text: message.text }))
}

async function fetchReply(
  setState: React.Dispatch<React.SetStateAction<OracleChatState>>,
  messages: OracleTranscriptMessage[],
): Promise<void> {
  setState((state) => ({ ...state, phase: 'chat', messages, suggestions: [], loading: true }))
  try {
    const { reply } = await requestOracleReply(toTurns(messages))
    const oracleMessage: OracleTranscriptMessage = {
      id: `m${messages.length}`,
      role: 'oracle',
      text: reply.message,
    }
    setState({
      phase: reply.recommendation ? 'result' : 'chat',
      messages: [...messages, oracleMessage],
      suggestions: reply.suggestions,
      recommendation: reply.recommendation,
      loading: false,
    })
  } catch {
    setState((state) => ({ ...state, phase: 'error', messages, loading: false }))
  }
}

export function useOracleChat() {
  const [state, setState] = useState(INITIAL_STATE)

  const start = useCallback(() => {
    if (!state.loading) {
      void fetchReply(setState, [])
    }
  }, [state.loading])

  const send = useCallback(
    (rawText: string) => {
      const text = rawText.trim().slice(0, MAX_INPUT_CHARS)
      if (!text || state.loading || state.phase !== 'chat') {
        return
      }
      const userMessage: OracleTranscriptMessage = {
        id: `m${state.messages.length}`,
        role: 'user',
        text,
      }
      void fetchReply(setState, [...state.messages, userMessage])
    },
    [state.loading, state.messages, state.phase],
  )

  const retry = useCallback(() => {
    if (!state.loading) {
      void fetchReply(setState, state.messages)
    }
  }, [state.loading, state.messages])

  return { state, start, send, retry }
}
