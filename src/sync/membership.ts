/**
 * Raid membership lifecycle (P2, FLAGS.raids): create/join/leave plus local
 * persistence. 2–5 members per raid; joining is by 6-char code.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

import { FLAGS } from '../contracts/flags';
import { raidApi } from './client';
import { getDeviceId } from './deviceId';
import { generateRaidCode, isValidRaidCode } from './raidCode';

const MEMBERSHIP_KEY = '8bit-sleep/raid-membership';
const MAX_MEMBERS = 5;

export interface RaidMembership {
  raidId: string;
  code: string;
}

export async function getMembership(): Promise<RaidMembership | null> {
  try {
    const raw = await AsyncStorage.getItem(MEMBERSHIP_KEY);
    return raw ? (JSON.parse(raw) as RaidMembership) : null;
  } catch {
    return null;
  }
}

/** Create a raid and join it as the first member; returns the invite code. */
export async function createRaid(
  heroType: string,
  heroName: string,
  hp: number,
): Promise<string | null> {
  if (!FLAGS.raids) {
    return null;
  }
  const raid = await raidApi.createRaid(generateRaidCode());
  if (!raid || !(await addMember(raid.id, heroType, heroName, hp))) {
    return null;
  }
  await saveMembership({ raidId: raid.id, code: raid.code });
  return raid.code;
}

/** Join an existing raid by code; false when unknown code or raid is full. */
export async function joinRaid(
  code: string,
  heroType: string,
  heroName: string,
  hp: number,
): Promise<boolean> {
  if (!FLAGS.raids || !isValidRaidCode(code)) {
    return false;
  }
  const raid = await raidApi.findRaid(code);
  if (!raid) {
    return false;
  }
  const members = await raidApi.listMembers(raid.id);
  if (!members || members.length >= MAX_MEMBERS) {
    return false;
  }
  if (!(await addMember(raid.id, heroType, heroName, hp))) {
    return false;
  }
  await saveMembership({ raidId: raid.id, code: raid.code });
  return true;
}

/** Leave anytime: remove my member row remotely, wipe the local membership. */
export async function leaveRaid(): Promise<void> {
  if (FLAGS.raids) {
    const membership = await getMembership();
    if (membership) {
      const deviceId = await getDeviceId();
      await raidApi.removeMember(membership.raidId, deviceId);
    }
  }
  await AsyncStorage.removeItem(MEMBERSHIP_KEY);
}

async function addMember(
  raidId: string,
  heroType: string,
  heroName: string,
  hp: number,
): Promise<boolean> {
  const deviceId = await getDeviceId();
  return raidApi.upsertMember(raidId, {
    device_id: deviceId,
    hero_type: heroType,
    hero_name: heroName,
    hp,
  });
}

async function saveMembership(membership: RaidMembership): Promise<void> {
  await AsyncStorage.setItem(MEMBERSHIP_KEY, JSON.stringify(membership));
}
