export const MUSIC_TRACKS = {
  DAY: 'music_day',
  NIGHT: 'music_night',
} as const

export const SFX_TRACKS = {
  CHEST: 'sfx_chest',
  DAMAGE: 'sfx_damage',
  DEATH: 'sfx_death',
  VICTORY: 'sfx_victory',
} as const

export type MusicKey = (typeof MUSIC_TRACKS)[keyof typeof MUSIC_TRACKS]
export type SfxKey = (typeof SFX_TRACKS)[keyof typeof SFX_TRACKS]

export const SFX_KEYS = Object.values(SFX_TRACKS) as readonly SfxKey[]
