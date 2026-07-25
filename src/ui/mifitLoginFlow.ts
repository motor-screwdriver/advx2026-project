import type { MiFitnessRegion } from '../contracts/mifit'

export type MiFitnessLoginPhase =
  'idle' | 'form' | 'connecting' | 'email_code' | 'verifying' | 'connected'

export interface MiFitnessLoginState {
  phase: MiFitnessLoginPhase
  challengeId: string | null
  challengeRegion: MiFitnessRegion | null
  error: string | null
}

export type MiFitnessLoginEvent =
  | { type: 'open_form' }
  | { type: 'connect_start' }
  | { type: 'email_required'; challengeId: string; region: MiFitnessRegion }
  | { type: 'verify_start' }
  | { type: 'connected' }
  | { type: 'failed'; error: string }
  | { type: 'reset' }

export const INITIAL_MIFIT_LOGIN_STATE: MiFitnessLoginState = {
  phase: 'idle',
  challengeId: null,
  challengeRegion: null,
  error: null,
}

export function mifitLoginReducer(
  state: MiFitnessLoginState,
  event: MiFitnessLoginEvent,
): MiFitnessLoginState {
  if (event.type === 'open_form') {
    return { ...INITIAL_MIFIT_LOGIN_STATE, phase: 'form' }
  }
  if (event.type === 'connect_start') {
    return { ...state, phase: 'connecting', error: null }
  }
  if (event.type === 'email_required') {
    return {
      phase: 'email_code',
      challengeId: event.challengeId,
      challengeRegion: event.region,
      error: null,
    }
  }
  if (event.type === 'verify_start') {
    return { ...state, phase: 'verifying', error: null }
  }
  if (event.type === 'connected') {
    return { ...INITIAL_MIFIT_LOGIN_STATE, phase: 'connected' }
  }
  if (event.type === 'failed') {
    return { ...state, phase: state.challengeId ? 'email_code' : 'form', error: event.error }
  }
  return INITIAL_MIFIT_LOGIN_STATE
}
