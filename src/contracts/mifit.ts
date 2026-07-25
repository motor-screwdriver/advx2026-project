export const MIFIT_REGIONS = ['de', 'cn', 'ru', 'i2', 'sg', 'us'] as const

export type MiFitnessRegion = (typeof MIFIT_REGIONS)[number]

export interface MiFitnessSession {
  security: string
  cookies: string
}

export interface StoredMiFitnessSession {
  version: 1
  provider: 'mifitness'
  region: MiFitnessRegion
  savedAt: string
  session: MiFitnessSession
}
