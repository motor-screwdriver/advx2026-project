/**
 * Native NFC reader for the Quote e-ink device (P1, FLAGS.eink).
 * Tapping the phone to a Quote surfaces its NDEF tag, whose first record is a
 * URL like https://dot.mindreset.tech/clip/quote/0/2/7CE8B17A3FCC — we decode
 * it and hand the trailing ID to parseDeviceId, so the user never copy-pastes.
 *
 * Native-only: react-native-nfc-manager is lazy-required and NFC does not exist
 * in Expo Go, so there loadNfc() returns null and scanning no-ops (the Settings
 * field stays manually editable as a fallback). `import type` is erased at
 * build time, so typing the module never triggers a runtime load.
 */
import { isRunningInExpoGo } from 'expo';
import type { TagEvent } from 'react-native-nfc-manager';

import { parseDeviceId } from './einkConfig';

type NfcModule = typeof import('react-native-nfc-manager');

let cached: NfcModule | null | undefined;
let started = false;

function loadNfc(): NfcModule | null {
  if (cached === undefined) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cached = isRunningInExpoGo() ? null : (require('react-native-nfc-manager') as NfcModule);
  }
  return cached;
}

/** True when in-app NFC scanning is possible (native build + NFC hardware). */
export async function isNfcAvailable(): Promise<boolean> {
  const mod = loadNfc();
  if (!mod) {
    return false;
  }
  try {
    return await mod.default.isSupported();
  } catch {
    return false;
  }
}

/**
 * Prompts an NFC scan and returns the parsed Quote device ID, or null if NFC
 * is unavailable, the user cancels, or the tag carries no usable URL.
 */
export async function scanDeviceId(): Promise<string | null> {
  const mod = loadNfc();
  if (!mod) {
    console.log('[nfc] scan unavailable — needs a dev/production build (NFC is off in Expo Go)');
    return null;
  }
  const manager = mod.default;
  try {
    if (!started) {
      await manager.start();
      started = true;
    }
    await manager.requestTechnology(mod.NfcTech.Ndef);
    const url = decodeFirstUrl(mod.Ndef, await manager.getTag());
    if (!url) {
      console.log('[nfc] tag read but no URL/text record found');
      return null;
    }
    const id = parseDeviceId(url);
    console.log(`[nfc] scanned device ID ${id}`);
    return id || null;
  } catch (error) {
    console.log('[nfc] scan cancelled or failed (silent):', error);
    return null;
  } finally {
    void manager.cancelTechnologyRequest().catch(() => undefined);
  }
}

/** Decode the first NDEF record's payload as a URI, falling back to text. */
function decodeFirstUrl(ndef: NfcModule['Ndef'], tag: TagEvent | null): string | null {
  const payload = tag?.ndefMessage?.[0]?.payload;
  if (!payload?.length) {
    return null;
  }
  const bytes = Uint8Array.from(payload as number[]);
  try {
    const uri = ndef.uri.decodePayload(bytes);
    if (uri) {
      return uri;
    }
  } catch {
    // Not a URI record — fall through and try a text record.
  }
  try {
    return ndef.text.decodePayload(bytes) || null;
  } catch {
    return null;
  }
}
