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
