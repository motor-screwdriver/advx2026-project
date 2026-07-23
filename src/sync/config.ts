/**
 * Raid backend config (P2, FLAGS.raids). Points at the project's own Go +
 * Postgres backend (see backend/, compose.yaml) — no third-party service.
 * The base URL comes from EXPO_PUBLIC_API_URL; when unset every sync call is
 * a silent no-op and solo play is unaffected.
 */
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/+$/, '');

export function apiConfigured(): boolean {
  return API_URL.length > 0;
}
