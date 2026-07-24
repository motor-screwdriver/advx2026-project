import type {
  ChatTurn,
  OracleReply,
  OracleRequest,
  OracleResponse,
} from '../contracts/aiOnboarding'

type ProcessLike = {
  env?: Record<string, string | undefined>
}

/**
 * In production (and when testing the client against the deployed Go backend)
 * EXPO_PUBLIC_API_ORIGIN points at the server, e.g. https://85.159.228.60.sslip.io.
 * Empty means same-origin relative requests.
 */
function resolveEndpoint(): string {
  const origin = (globalThis as typeof globalThis & { process?: ProcessLike }).process?.env
    ?.EXPO_PUBLIC_API_ORIGIN
  return origin ? `${origin.replace(/\/+$/, '')}/api/oracle` : '/api/oracle'
}

export const ORACLE_ENDPOINT = resolveEndpoint()

/** Must exceed the server-side provider timeout (60s) so the server error reaches the user. */
const TIMEOUT_MS = 75_000

function isReply(value: unknown): value is OracleReply {
  if (!value || typeof value !== 'object') {
    return false
  }
  const reply = value as Partial<OracleReply>
  return (
    typeof reply.message === 'string' &&
    Array.isArray(reply.suggestions) &&
    (reply.recommendation === null || typeof reply.recommendation === 'object')
  )
}

function parseResponse(value: unknown): OracleResponse {
  const reply = (value as Partial<OracleResponse> | null)?.reply
  if (!isReply(reply)) {
    throw new Error('Invalid oracle response')
  }
  return { reply }
}

export async function requestOracleReply(turns: readonly ChatTurn[]): Promise<OracleResponse> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
  const request: OracleRequest = { turns: [...turns] }
  try {
    const response = await fetch(ORACLE_ENDPOINT, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    })
    if (!response.ok) {
      throw new Error(`Oracle request failed: ${response.status}`)
    }
    return parseResponse((await response.json()) as unknown)
  } finally {
    clearTimeout(timeout)
  }
}
