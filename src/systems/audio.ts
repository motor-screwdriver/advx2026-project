/**
 * Chiptune audio manager (PROMPT D). Thin imperative wrapper over expo-audio:
 * one looping music track at a time plus fire-and-forget SFX. Screens call
 * these helpers on game events; nothing here touches game state.
 */
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio'

import { AUDIO } from '../../assets/manifest'

export type MusicKey = 'music_day' | 'music_night'
export type SfxKey = 'sfx_chest' | 'sfx_damage' | 'sfx_death' | 'sfx_victory'

const MUSIC_VOLUME = 0.5
// Sleep/Wake track swap: old theme dies down, then the new one enters.
// 250 + 300 ms ≈ the 550 ms book<->night stage crossfade (HomeSleepStage),
// so the ear and the eye finish the scene change together.
const FADE_OUT_MS = 250
const FADE_IN_MS = 300
const FADE_STEP_MS = 30

let musicPlayer: AudioPlayer | null = null
let musicKey: MusicKey | null = null
// Undoes whatever transition is in flight (fade timer + pending player).
let cancelTransition: (() => void) | null = null
const sfxPlayers: Partial<Record<SfxKey, AudioPlayer>> = {}
let enabled = true
let initialized = false

function init(): void {
  if (initialized) {
    return
  }
  initialized = true
  // Bedside use: keep the chiptune audible even with the ringer silenced.
  setAudioModeAsync({ playsInSilentMode: true }).catch(() => {})
}

/** pause() before remove(): remove() alone releases the JS handle but can
 * leave the native looping player sounding (the day/night overlap bug). */
function releasePlayer(player: AudioPlayer): void {
  player.pause()
  player.remove()
}

/** Linear volume ramp on a setInterval; returns a cancel function. */
function fadeVolume(
  player: AudioPlayer,
  from: number,
  to: number,
  durationMs: number,
  onDone: () => void,
): () => void {
  const steps = Math.max(1, Math.round(durationMs / FADE_STEP_MS))
  let step = 0
  player.volume = from
  const timer = setInterval(() => {
    step += 1
    player.volume = from + ((to - from) * step) / steps
    if (step >= steps) {
      clearInterval(timer)
      player.volume = to
      onDone()
    }
  }, FADE_STEP_MS)
  return () => clearInterval(timer)
}

/** Create the new track at zero volume and ease it in. */
function startMusic(key: MusicKey): void {
  const player = createAudioPlayer(AUDIO[key].source)
  player.loop = true
  player.volume = 0
  player.play()
  musicPlayer = player
  const cancelFade = fadeVolume(player, 0, MUSIC_VOLUME, FADE_IN_MS, () => {
    cancelTransition = null
  })
  cancelTransition = cancelFade
}

/** Master switch for the Settings sound toggle. Off also stops music. */
export function setAudioEnabled(on: boolean): void {
  enabled = on
  if (!on) {
    stopMusic()
  }
}

/** Swap to a looping music track: fade the current one out, then fade the
 * new one in. No-op if it's already playing (or being faded in). */
export function playMusic(key: MusicKey): void {
  init()
  if (!enabled || musicKey === key) {
    return
  }
  // A rapid re-switch lands here mid-transition: finish the old one now
  // (kill its timer, silence its player) so nothing stacks up.
  cancelTransition?.()
  cancelTransition = null
  musicKey = key
  const outgoing = musicPlayer
  musicPlayer = null
  if (!outgoing) {
    startMusic(key)
    return
  }
  const cancelFade = fadeVolume(outgoing, outgoing.volume, 0, FADE_OUT_MS, () => {
    releasePlayer(outgoing)
    startMusic(key)
  })
  cancelTransition = () => {
    cancelFade()
    releasePlayer(outgoing)
  }
}

/** Immediate stop (no fade) — used by the master sound toggle. */
export function stopMusic(): void {
  cancelTransition?.()
  cancelTransition = null
  if (musicPlayer) {
    releasePlayer(musicPlayer)
    musicPlayer = null
  }
  musicKey = null
}

/** Play a one-shot sound effect, reusing a cached player per key. */
export function playSfx(key: SfxKey): void {
  init()
  if (!enabled) {
    return
  }
  let player = sfxPlayers[key]
  if (!player) {
    player = createAudioPlayer(AUDIO[key].source)
    sfxPlayers[key] = player
  }
  player.seekTo(0)
  player.play()
}
