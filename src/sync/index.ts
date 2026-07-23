/**
 * Raid client API surface (P2, FLAGS.raids) — everything Dev A needs for the
 * Raid Lobby screen lives behind this one import. All calls fail soft: an
 * unreachable backend / flipped-off flag → null/false, never a thrown UI.
 */
export { OUTCOME_POINTS, getCampfireLevel, teamChestEarned, weeklyPoints } from './campfire'
export type { CampfireLevel, MemberNight } from './campfire'
export { syncNow } from './campfireSync'
export type { CampfireView, RaidMemberView } from './campfireSync'
export { createRaid, getMembership, joinRaid, leaveRaid } from './membership'
export type { RaidMembership } from './membership'
export { RAID_CODE_LENGTH, generateRaidCode, isValidRaidCode } from './raidCode'
