/** Shared wire contract for the first-run sleep-oracle conversation. */
export interface ChatTurn {
  role: 'oracle' | 'user'
  text: string
}

export interface SleepRecommendation {
  bedMin: number
  wakeMin: number
  reason: string
}

export interface OracleReply {
  message: string
  /** Short tap-to-answer hints in the traveler's voice; empty on the final reading. */
  suggestions: string[]
  recommendation: SleepRecommendation | null
}

export interface OracleRequest {
  turns: ChatTurn[]
}

export interface OracleResponse {
  reply: OracleReply
}
