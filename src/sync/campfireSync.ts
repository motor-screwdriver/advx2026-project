/**
 * Campfire sync (P2, FLAGS.raids): push my member card + latest night, pull
 * the team's. Triggered on app open + pull-to-refresh only — NO realtime
 * subscriptions. Unreachable backend → silent null; solo play unaffected.
 */
import { FLAGS } from '../contracts/flags'
import type { GameState, NightOutcome, PixelColor } from '../contracts/types'
import {
  getCampfireLevel,
  teamChestEarned,
  weeklyPoints,
  type CampfireLevel,
  type MemberNight,
} from './campfire'
import { raidApi, type MemberRow, type NightRow } from './client'
import { getDeviceId } from './deviceId'
import { getMembership } from './membership'

export interface RaidMemberView {
  deviceId: string
  heroType: string
  heroName: string
  hp: number // teammate hearts, as of their last sync
  lastPixel: PixelColor | null // their last-night mosaic pixel
}

export interface CampfireView {
  code: string
  level: CampfireLevel
  points: number
  teamChest: boolean
  members: RaidMemberView[]
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

/** Full round-trip: push my state, then read the whole raid back. */
export async function syncNow(
  state: GameState,
  now: Date = new Date(),
): Promise<CampfireView | null> {
  if (!FLAGS.raids || !state.hero) {
    return null
  }
  const membership = await getMembership()
  if (!membership) {
    return null
  }
  await pushMine(membership.raidId, state)
  return pullCampfire(membership.raidId, membership.code, now)
}

async function pushMine(raidId: string, state: GameState): Promise<void> {
  const deviceId = await getDeviceId()
  await raidApi.upsertMember(raidId, {
    device_id: deviceId,
    hero_type: state.hero!.type,
    hero_name: state.hero!.name,
    hp: state.hp,
  })
  const last = state.nights[state.nights.length - 1]
  if (last) {
    await raidApi.upsertNight(raidId, {
      device_id: deviceId,
      date: last.date,
      score: last.score,
      outcome: last.outcome,
    })
  }
}

async function pullCampfire(raidId: string, code: string, now: Date): Promise<CampfireView | null> {
  const weekCutoff = new Date(now.getTime() - WEEK_MS).toISOString().slice(0, 10)
  const [members, nights] = await Promise.all([
    raidApi.listMembers(raidId),
    raidApi.listNights(raidId, weekCutoff),
  ])
  if (!members || !nights) {
    return null
  }
  const memberNights: MemberNight[] = nights.map((night) => ({
    deviceId: night.device_id,
    date: night.date,
    outcome: night.outcome as NightOutcome,
  }))
  const points = weeklyPoints(memberNights, now)
  return {
    code,
    level: getCampfireLevel(points),
    points,
    teamChest: teamChestEarned(points, members.length),
    members: members.map((member) => toMemberView(member, nights)),
  }
}

function toMemberView(member: MemberRow, nights: NightRow[]): RaidMemberView {
  const latest = nights
    .filter((night) => night.device_id === member.device_id)
    .sort((a, b) => b.date.localeCompare(a.date))[0]
  return {
    deviceId: member.device_id,
    heroType: member.hero_type,
    heroName: member.hero_name,
    hp: member.hp,
    lastPixel: latest ? pixelOf(latest.outcome as NightOutcome) : null,
  }
}

function pixelOf(outcome: NightOutcome): PixelColor {
  if (outcome === 'PERFECT') {
    return 'GOLD'
  }
  if (outcome === 'TERRIBLE' || outcome === 'MISSED') {
    return 'BLACK'
  }
  return 'GRAY'
}
