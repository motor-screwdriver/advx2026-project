/**
 * Anonymous device identity for raids (P2): no accounts — a generated
 * device ID persisted locally, used as raid_members.device_id.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '8bit-sleep/device-id';

export async function getDeviceId(): Promise<string> {
  const existing = await AsyncStorage.getItem(KEY);
  if (existing) {
    return existing;
  }
  const created = uuid();
  await AsyncStorage.setItem(KEY, created);
  return created;
}

/** RFC4122 v4-ish UUID from Math.random — unique enough for a raid table. */
function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
    const r = Math.floor(Math.random() * 16);
    const v = ch === 'x' ? r : (r % 4) + 8;
    return v.toString(16);
  });
}
