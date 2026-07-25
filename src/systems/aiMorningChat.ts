import type { ChatTurn, OracleReply, OracleResponse } from '../contracts/aiOnboarding'

export interface MorningContext {
  outcome: string // PERFECT | GOOD | BAD | TERRIBLE | MISSED
  hpDelta: number
  xp: number
}

type ProcessLike = {
  env?: Record<string, string | undefined>
}

function resolveEndpoint(): string {
  const origin = (globalThis as typeof globalThis & { process?: ProcessLike }).process?.env
    ?.EXPO_PUBLIC_API_ORIGIN
  return origin ? `${origin.replace(/\/+$/, '')}/api/morning-oracle` : '/api/morning-oracle'
}

export const MORNING_ORACLE_ENDPOINT = resolveEndpoint()

/** Must exceed the server-side provider timeout (60s) so the server error reaches the user. */
const TIMEOUT_MS = 75_000

function isReply(value: unknown): value is OracleReply {
  if (!value || typeof value !== 'object') {
    return false
  }
  const reply = value as Partial<OracleReply>
  return typeof reply.message === 'string' && Array.isArray(reply.suggestions)
}

function parseResponse(value: unknown): OracleResponse {
  const reply = (value as Partial<OracleResponse> | null)?.reply
  if (!isReply(reply)) {
    throw new Error('Invalid morning oracle response')
  }
  return { reply }
}

export async function requestMorningReply(
  turns: readonly ChatTurn[],
  context: MorningContext,
): Promise<OracleResponse> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
  const request = { turns: [...turns], context }
  try {
    const response = await fetch(MORNING_ORACLE_ENDPOINT, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    })
    if (!response.ok) {
      throw new Error(`Morning oracle request failed: ${response.status}`)
    }
    return parseResponse((await response.json()) as unknown)
  } finally {
    clearTimeout(timeout)
  }
}
