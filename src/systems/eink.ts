/**
 * Dot Quote/0 e-ink push client (P1, FLAGS.eink). The phone pushes both
 * cards straight to the Dot cloud — no backend, no firmware. Every failure
 * is silent (try/catch + log): the game never depends on the device or the
 * network. Pushes are debounced 5 s (store events arrive in bursts).
 */
import { FLAGS } from '../contracts/flags';
import { mockGameState } from '../contracts/mock';
import type { GameState } from '../contracts/types';
import { useGameStore } from '../state/store';
import { captureCardBase64, captureIconBase64 } from './einkCard';
import { getEinkConfig, setEinkConfig, type EinkConfig } from './einkConfig';

const API_BASE = 'https://dot.mindreset.tech/api/authV2/open/device';
const APP_LINK = 'eightbitsleep://'; // app.json scheme — NFC tap opens the app
const DEBOUNCE_MS = 5000;
const REQUEST_TIMEOUT_MS = 8000;

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

async function postToDevice(
  config: EinkConfig,
  path: 'image' | 'text',
  body: Record<string, unknown>,
): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const res = await fetch(`${API_BASE}/${config.deviceId}/${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return res.ok;
  } catch (error) {
    console.log('[eink] push skipped (silent):', error);
    return false;
  }
}

/** Image API: the 296×152 hero card, pixel-perfect B&W (ditherType NONE). */
export async function pushHeroCard(state: GameState, config?: EinkConfig): Promise<boolean> {
  if (!FLAGS.eink) {
    return false;
  }
  const cfg = config ?? (await getEinkConfig());
  const image = await captureCardBase64();
  if (!cfg || !image) {
    return false;
  }
  return postToDevice(cfg, 'image', {
    image,
    refreshNow: true,
    link: APP_LINK,
    border: 1,
    ditherType: 'NONE',
  });
}

/** Text API: last night outcome + perfect week + perfect rate, pixel font. */
export async function pushStatsCard(state: GameState, config?: EinkConfig): Promise<boolean> {
  if (!FLAGS.eink) {
    return false;
  }
  const cfg = config ?? (await getEinkConfig());
  const icon = await captureIconBase64();
  if (!cfg || !icon) {
    return false;
  }
  return postToDevice(cfg, 'text', {
    title: '8BIT SLEEP',
    message: statsMessage(state),
    signature: statsDate(state),
    icon,
    link: APP_LINK,
    styles: { message: { fontFamily: 'FusionPixel12' } },
  });
}

/** Trailing 5 s debounce — one push after the last trigger in a burst. */
export function scheduleEinkPush(state: GameState): void {
  if (!FLAGS.eink) {
    return;
  }
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    void pushHeroCard(state);
    void pushStatsCard(state);
  }, DEBOUNCE_MS);
}

/**
 * Settings "Send test card" (booth setup verification): persists the entered
 * config and pushes both cards with current state (mock hero on fresh installs).
 */
export async function sendTestCard(deviceId?: string, apiKey?: string): Promise<boolean> {
  if (!FLAGS.eink) {
    console.log('[eink] FLAGS.eink is false — flip it in contracts/flags.ts to push');
    return false;
  }
  const config = deviceId && apiKey ? { deviceId, apiKey } : await getEinkConfig();
  if (!config) {
    console.log('[eink] no device config — enter device ID + API key first');
    return false;
  }
  await setEinkConfig(config);
  const live = useGameStore.getState().game;
  const state = live.hero ? live : mockGameState();
  const [card, stats] = await Promise.all([
    pushHeroCard(state, config),
    pushStatsCard(state, config),
  ]);
  return card && stats;
}

function statsMessage(state: GameState): string {
  const last = state.nights[state.nights.length - 1];
  const nightLine = last
    ? `Last night: ${last.outcome} (${last.hpDelta >= 0 ? '+' : ''}${last.hpDelta} HP)`
    : 'No nights yet';
  const perfect = state.nights.filter((night) => night.outcome === 'PERFECT').length;
  const rate = state.nights.length ? Math.round((perfect / state.nights.length) * 100) : 0;
  return `${nightLine}\nPerfect week: ${state.perfectWeekStreak}/7\nPerfect rate: ${rate}%`;
}

function statsDate(state: GameState): string {
  return state.nights[state.nights.length - 1]?.date ?? new Date().toISOString().slice(0, 10);
}
