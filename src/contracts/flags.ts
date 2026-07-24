/** Feature flags. Unfinished work hides behind these — main always boots. */
export const FLAGS = {
  levels: true,
  chests: true,
  healthSync: false,
  eink: true,
  selfieFace: false,
  artGallery: true,
} as const

export type FlagName = keyof typeof FLAGS
