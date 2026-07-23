/**
 * ALL user-facing text lives here (product language: English only).
 * Flat key-value, no i18n framework (NFR-08).
 */
export const strings = {
  appName: '8bit Sleep',

  onboarding_title: 'Onboarding',
  onboarding_body: 'Stub. Welcome screens + sleep window picker (7-12 h) land here.',

  ceremony_title: 'Hero Ceremony',
  ceremony_body: 'Stub. The summoning circle assigns your hero from the 3x3 grid.',

  home_title: '8bit Sleep',
  home_body: 'Stub. Hero, 7 hearts, streak, one context button (Sleep / Wake up).',
  home_debug_title: '-- Debug menu (temporary) --',

  morning_title: 'Morning Report',
  morning_body: 'Stub. 10-15 s preset cut-scene: what happened while you slept.',

  death_title: 'You Died',
  death_body: 'Stub. Death scene + resurrection offer (Soul Tether, 1 per 7 days).',

  resurrection_title: 'Soul Tether',
  resurrection_body: 'Stub. Timing mini-game: 3 rounds, hit the golden zone 2+ times.',

  mosaic_title: 'Year Mosaic',
  mosaic_body: 'Stub. 365 pixels: GOLD / GRAY / BLACK - your year of sleep.',

  chest_title: 'Loot Chest',
  chest_body: 'Stub. Perfect Week reward: Common 70% / Rare 25% / Epic 5%.',

  inventory_title: 'Inventory',
  inventory_body: 'Stub. 2 equip slots (Armor + Charm) + consumable artifacts.',

  settings_title: 'Settings',
  settings_body: 'Stub. Sleep window, notifications, e-ink, reset progress.',
  settings_version: 'v0.1.0',

  raid_title: 'Campfire Raid',
  raid_body: 'Stub. 2-5 heroes around one campfire (Supabase, P2).',
  raid_disabled: 'Disabled: FLAGS.raids = false.',

  gallery_title: 'Art Gallery',
  gallery_body: 'QA wall: every pipeline asset, straight from assets/manifest.ts.',
} as const;

export type StringKey = keyof typeof strings;
