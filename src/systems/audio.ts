/**
 * Chiptune audio manager (PROMPT D). Thin imperative wrapper over expo-audio:
 * one looping music track at a time plus fire-and-forget SFX. Screens call
 * these helpers on game events; nothing here touches game state.
 */
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

import { AUDIO } from '../../assets/manifest';

export type MusicKey = 'music_day' | 'music_night';
export type SfxKey = 'sfx_chest' | 'sfx_damage' | 'sfx_death' | 'sfx_victory';

let musicPlayer: AudioPlayer | null = null;
let musicKey: MusicKey | null = null;
const sfxPlayers: Partial<Record<SfxKey, AudioPlayer>> = {};
let enabled = true;
let initialized = false;

function init(): void {
  if (initialized) {
    return;
  }
  initialized = true;
  // Bedside use: keep the chiptune audible even with the ringer silenced.
  setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
}

/** Master switch for the Settings sound toggle. Off also stops music. */
export function setAudioEnabled(on: boolean): void {
  enabled = on;
  if (!on) {
    stopMusic();
  }
}

/** Start (or swap to) a looping music track. No-op if already playing it. */
export function playMusic(key: MusicKey): void {
  init();
  if (!enabled || musicKey === key) {
    return;
  }
  stopMusic();
  const player = createAudioPlayer(AUDIO[key].source);
  player.loop = true;
  player.volume = 0.5;
  player.play();
  musicPlayer = player;
  musicKey = key;
}

export function stopMusic(): void {
  if (musicPlayer) {
    musicPlayer.remove();
    musicPlayer = null;
    musicKey = null;
  }
}

/** Play a one-shot sound effect, reusing a cached player per key. */
export function playSfx(key: SfxKey): void {
  init();
  if (!enabled) {
    return;
  }
  let player = sfxPlayers[key];
  if (!player) {
    player = createAudioPlayer(AUDIO[key].source);
    sfxPlayers[key] = player;
  }
  player.seekTo(0);
  player.play();
}
