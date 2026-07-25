import type { MiFitnessSession } from '../contracts/mifit'
import type { CachedSleepPlan } from '../state/mifitStore'
import { apiEndpoint } from './api'

const SLEEP_PLAN_TIMEOUT_MS = 90_000

export interface SleepPlanRequest {
  mifitSession: MiFitnessSession
  region: string
}

export interface SleepPlanApiResponse {
  status: 'ok' | 'no_data'
  lumaMessage: string
  plan?: {
    bedTime: string
    wakeTime: string
    ritualSteps: string[]
    reason: string
  }
  stats?: {
    totalNights: number
    avgDurationMin: number
    avgBedTime: string
    avgWakeTime: string
    avgDeepPct: number
    consistencyScore: number
  }
}

export class SleepPlanSessionExpiredError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SleepPlanSessionExpiredError'
  }
}

export async function fetchSleepPlan(request: SleepPlanRequest): Promise<CachedSleepPlan> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), SLEEP_PLAN_TIMEOUT_MS)
  const url = apiEndpoint('/api/sleep-plan')

  try {
    console.info(`[sleep-plan] POST ${url}`)
    let response: Response
    try {
      response = await fetch(url, {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      })
    } catch (err) {
      console.warn(`[sleep-plan] POST ${url} transport failed`, err)
      throw new Error(
        'Network error while fetching sleep plan. Check that the server is reachable.',
      )
    }

    console.info(`[sleep-plan] POST ${url} -> ${response.status}`)
    const text = await response.text()
    let payload: unknown
    try {
      payload = text.trim() ? JSON.parse(text) : null
    } catch {
      throw new Error('Sleep plan returned non-JSON response.')
    }

    if (response.status === 401) {
      const msg = (payload as { error?: string })?.error ?? 'Session expired'
      throw new SleepPlanSessionExpiredError(msg)
    }

    if (!response.ok) {
      const msg = (payload as { error?: string })?.error ?? 'Sleep plan request failed'
      throw new Error(msg)
    }

    const body = payload as SleepPlanApiResponse
    return {
      fetchedAt: new Date().toISOString(),
      status: body.status,
      lumaMessage: body.lumaMessage,
      plan: body.plan,
      stats: body.stats,
    }
  } finally {
    clearTimeout(timeout)
  }
}

/** Returns true if the cached plan is still fresh (less than 24 hours old). */
export function isSleepPlanFresh(plan: CachedSleepPlan | null): boolean {
  if (!plan) return false
  const fetchedAt = new Date(plan.fetchedAt).getTime()
  const now = Date.now()
  const ONE_DAY_MS = 24 * 60 * 60 * 1000
  return now - fetchedAt < ONE_DAY_MS
}
