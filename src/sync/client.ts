/**
 * Raid backend client over fetch (P2 — talks to the project's Go + Postgres
 * backend). Every call fails soft (null/false): an unreachable backend means
 * silent offline, the solo game is never blocked by sync.
 */
import { API_URL, apiConfigured } from './config'

const TIMEOUT_MS = 6000

export interface RaidRow {
  id: string
  code: string
  created_at: string
}

export interface MemberRow {
  device_id: string
  hero_type: string
  hero_name: string
  hp: number
}

export interface NightRow {
  device_id: string
  date: string
  score: number
  outcome: string
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T | null> {
  if (!apiConfigured()) {
    return null
  }
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
    const res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
      signal: controller.signal,
    })
    clearTimeout(timeout)
    if (!res.ok) {
      return null
    }
    const text = await res.text()
    return text ? (JSON.parse(text) as T) : null
  } catch {
    return null // offline, timeout, bad JSON — all silent by design
  }
}

/** Status-only call for mutations that reply 204 No Content. */
async function mutate(path: string, init: RequestInit): Promise<boolean> {
  if (!apiConfigured()) {
    return false
  }
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
    const res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
      signal: controller.signal,
    })
    clearTimeout(timeout)
    return res.ok
  } catch {
    return false
  }
}

const enc = encodeURIComponent

/** Semantic raid API — the only backend surface the rest of sync uses. */
export const raidApi = {
  createRaid: (code: string) =>
    request<RaidRow>('/raids', { method: 'POST', body: JSON.stringify({ code }) }),

  findRaid: (code: string) => request<RaidRow>(`/raids/${enc(code)}`),

  listMembers: (raidId: string) => request<MemberRow[]>(`/raids/${enc(raidId)}/members`),

  upsertMember: (raidId: string, member: MemberRow) =>
    mutate(`/raids/${enc(raidId)}/members`, { method: 'PUT', body: JSON.stringify(member) }),

  removeMember: (raidId: string, deviceId: string) =>
    mutate(`/raids/${enc(raidId)}/members/${enc(deviceId)}`, { method: 'DELETE' }),

  listNights: (raidId: string, since: string) =>
    request<NightRow[]>(`/raids/${enc(raidId)}/nights?since=${enc(since)}`),

  upsertNight: (raidId: string, night: NightRow) =>
    mutate(`/raids/${enc(raidId)}/nights`, { method: 'PUT', body: JSON.stringify(night) }),
}
