/**
 * E-ink device config (P1, FLAGS.eink): deviceId + apiKey entered once in
 * Settings, stored locally on-device only. Never leaves the phone except
 * as the Authorization header of Dot API calls.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '8bit-sleep/eink-config';

export interface EinkConfig {
  deviceId: string;
  apiKey: string;
}

export async function getEinkConfig(): Promise<EinkConfig | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<EinkConfig>;
    return parsed.deviceId && parsed.apiKey
      ? { deviceId: parsed.deviceId, apiKey: parsed.apiKey }
      : null;
  } catch {
    return null;
  }
}

export async function setEinkConfig(config: EinkConfig): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(config));
}

/**
 * Accepts either a raw device ID or a full Quote NFC link and returns just the
 * ID. Tapping a phone to the Quote surfaces a link like
 * https://dot.mindreset.tech/clip/quote/0/2/7CE8B17A3FCC — the ID is the last
 * path segment. Non-URL input passes through trimmed.
 */
export function parseDeviceId(input: string): string {
  const trimmed = input.trim();
  if (!trimmed.includes('/')) {
    return trimmed;
  }
  const path = trimmed.split(/[?#]/)[0].replace(/\/+$/, '');
  return path.slice(path.lastIndexOf('/') + 1);
}
