import * as SecureStore from 'expo-secure-store'

import type { MiFitnessRegion, MiFitnessSession, StoredMiFitnessSession } from '../contracts/mifit'
import { MIFIT_REGIONS } from '../contracts/mifit'
import { apiEndpoint } from './api'

export const MIFIT_SESSION_KEY = '8bit-sleep.mifit-session.v1'
const KEYCHAIN_SERVICE = '8bit-sleep-mifit-session'
const TIMEOUT_MS = 60_000

export interface MiFitnessLoginInput {
  username: string
  password: string
  region: MiFitnessRegion
}

export interface MiFitnessVerifyEmailInput {
  challengeId: string
  code: string
}

export type MiFitnessAuthResponse =
  | { status: 'connected'; region: MiFitnessRegion; session: MiFitnessSession }
  | { status: 'email_verification_required'; region: MiFitnessRegion; challengeId: string }

function isRegion(value: unknown): value is MiFitnessRegion {
  return typeof value === 'string' && MIFIT_REGIONS.includes(value as MiFitnessRegion)
}

function isSession(value: unknown): value is MiFitnessSession {
  const session = value as Partial<MiFitnessSession> | null
  return (
    Boolean(session) && typeof session?.security === 'string' && typeof session.cookies === 'string'
  )
}

function parseAuthResponse(value: unknown): MiFitnessAuthResponse {
  const body = value as {
    status?: unknown
    region?: unknown
    session?: unknown
    challengeId?: unknown
  } | null
  if (!body || !isRegion(body.region)) {
    throw new Error('Invalid Mi Fitness response')
  }
  if (body.status === 'connected' && isSession(body.session)) {
    return { status: body.status, region: body.region, session: body.session }
  }
  if (body.status === 'email_verification_required' && typeof body.challengeId === 'string') {
    return { status: body.status, region: body.region, challengeId: body.challengeId }
  }
  throw new Error('Invalid Mi Fitness response')
}

async function postMiFitness(path: string, body: unknown): Promise<MiFitnessAuthResponse> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
  const url = apiEndpoint(path)
  try {
    console.info(`[mifit] POST ${url}`)
    let response: Response
    try {
      response = await fetch(url, {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    } catch (err) {
      console.warn(`[mifit] POST ${url} transport failed`, err)
      throw new Error(
        `Network error while calling ${url}. Check that the Go backend is running and reachable from this device.`,
      )
    }
    console.info(`[mifit] POST ${url} -> ${response.status}`)
    const payload = await readResponsePayload(response)
    if (!response.ok) {
      const message = (payload as { error?: unknown }).error
      throw new Error(typeof message === 'string' ? message : 'Mi Fitness request failed')
    }
    return parseAuthResponse(payload)
  } finally {
    clearTimeout(timeout)
  }
}

async function readResponsePayload(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text.trim()) {
    return null
  }
  try {
    return JSON.parse(text) as unknown
  } catch {
    const preview = text.trim().slice(0, 80)
    const hint =
      response.status === 404
        ? 'Mi Fitness endpoint not found. Check EXPO_PUBLIC_API_ORIGIN/URL and restart the Go backend.'
        : 'Mi Fitness returned a non-JSON response.'
    throw new Error(`${hint} (${response.status}: ${preview})`)
  }
}

export function miFitnessSessionRecord(
  region: MiFitnessRegion,
  session: MiFitnessSession,
  now = new Date(),
): StoredMiFitnessSession {
  return { version: 1, provider: 'mifitness', region, savedAt: now.toISOString(), session }
}

export async function loginToMiFitness(input: MiFitnessLoginInput): Promise<MiFitnessAuthResponse> {
  return postMiFitness('/api/mifit/login', input)
}

export async function verifyMiFitnessEmail(
  input: MiFitnessVerifyEmailInput,
): Promise<MiFitnessAuthResponse> {
  return postMiFitness('/api/mifit/verify-email', input)
}

export async function saveMiFitnessSession(record: StoredMiFitnessSession): Promise<void> {
  await SecureStore.setItemAsync(MIFIT_SESSION_KEY, JSON.stringify(record), {
    keychainService: KEYCHAIN_SERVICE,
  })
}

export async function loadMiFitnessSession(): Promise<StoredMiFitnessSession | null> {
  let raw: string | null
  try {
    raw = await SecureStore.getItemAsync(MIFIT_SESSION_KEY, {
      keychainService: KEYCHAIN_SERVICE,
    })
  } catch {
    return null
  }
  if (!raw) {
    return null
  }
  let value: Partial<StoredMiFitnessSession>
  try {
    value = JSON.parse(raw) as Partial<StoredMiFitnessSession>
  } catch {
    return null
  }
  if (
    value.version !== 1 ||
    value.provider !== 'mifitness' ||
    !isRegion(value.region) ||
    typeof value.savedAt !== 'string' ||
    !isSession(value.session)
  ) {
    return null
  }
  return {
    version: 1,
    provider: 'mifitness',
    region: value.region,
    savedAt: value.savedAt,
    session: value.session,
  }
}

export async function deleteMiFitnessSession(): Promise<void> {
  await SecureStore.deleteItemAsync(MIFIT_SESSION_KEY, { keychainService: KEYCHAIN_SERVICE })
}
