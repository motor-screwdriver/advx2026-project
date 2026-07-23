/** Feature flags. Unfinished work hides behind these — main always boots. */
export const FLAGS = {
  levels: true,
  chests: true,
  raids: false,
  healthSync: false,
  eink: false,
  selfieFace: false,
  artGallery: true,
} as const;

export type FlagName = keyof typeof FLAGS;
