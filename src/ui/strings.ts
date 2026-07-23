/**
 * ALL user-facing text lives here (product language: English only).
 * Flat key-value, no i18n framework (NFR-08).
 */
export const strings = {
  appName: '8bit Sleep',

  // Onboarding
  onboarding_title: 'Your hero needs sleep',
  onboarding_intro_1: 'A pixel hero lives only while you sleep.',
  onboarding_intro_2: 'Bad nights deal damage. 0 HP = death.',
  onboarding_intro_3: '7 clean nights = level up + loot chest.',
  onboarding_bedtime: 'Bedtime',
  onboarding_wakeup: 'Wake up',
  onboarding_duration: 'Duration',
  onboarding_min_hours: 'Minimum 7 hours',
  onboarding_begin: 'Set window',

  // Hero ceremony
  ceremony_summoning: 'Summoning your hero...',
  ceremony_awakens: 'answers the call',
  ceremony_begin: 'Begin',

  // Heroes (display names)
  hero_monk: 'Monk',
  hero_ranger: 'Ranger',
  hero_druid: 'Druid',
  hero_rogue: 'Rogue',
  hero_knight: 'Knight',
  hero_paladin: 'Paladin',
  hero_ninja: 'Ninja',
  hero_mage: 'Mage',
  hero_warlock: 'Warlock',

  // Hero passives
  passive_monk: '+10% XP every night',
  passive_ranger: 'Wake-up tolerance +15 min',
  passive_druid: 'No oversleep penalty',
  passive_rogue: 'Bedtime tolerance +15 min',
  passive_knight: '+5% Rare loot chance',
  passive_paladin: 'Wider golden zone in Soul Tether',
  passive_ninja: '1 missed check-in per week auto-filled',
  passive_mage: '1 TERRIBLE night per week: -1 HP instead of -2',
  passive_warlock: '+5% Epic loot chance',

  // Home
  home_title: '8bit Sleep',
  home_streak: 'Perfect week',
  home_level: 'LV',
  home_sleep: 'Sleep',
  home_wakeup: 'Wake up',
  home_no_hero: 'No hero yet. Complete the summoning first.',

  // Night outcomes
  outcome_perfect: 'PERFECT',
  outcome_good: 'GOOD',
  outcome_bad: 'BAD',
  outcome_terrible: 'TERRIBLE',
  outcome_missed: 'MISSED',

  // Morning scene
  morning_title: 'Morning report',
  morning_continue: 'Continue',
  morning_missed: 'No check-in. The night went unrecorded.',

  // Death & resurrection
  death_title: 'You died',
  death_body: 'The hero falls. The hearts are empty.',
  death_resurrect_cta: 'Attempt resurrection',
  death_gone: 'Your hero is gone.',
  death_new_hero: 'Summon a new hero',
  death_no_charge: 'Soul Tether is recharging (1 use per 7 days).',

  soul_title: 'Soul Tether',
  soul_round: 'Round',
  soul_tap: 'TAP IN THE GOLDEN ZONE',
  soul_hit: 'Hit!',
  soul_miss: 'Miss...',
  soul_success: 'The tether holds. The hero returns.',
  soul_fail: 'The tether breaks.',

  // Mosaic
  mosaic_title: 'Year mosaic',
  mosaic_level: 'Level',
  mosaic_streak: 'Streak',
  mosaic_perfect: 'Perfect',
  mosaic_empty: 'No nights recorded yet. Sleep well tonight!',

  // Chest
  chest_title: 'Loot chest',
  chest_tap: 'Tap to open',
  chest_equip: 'Equip',
  chest_close: 'Close',
  rarity_common: 'Common',
  rarity_rare: 'Rare',
  rarity_epic: 'Epic',

  // Inventory
  inventory_title: 'Inventory',
  inventory_armor: 'Armor',
  inventory_charm: 'Charm',
  inventory_consumables: 'Artifacts',
  inventory_empty: 'Empty. Earn chests with perfect weeks.',
  inventory_equipped: 'Equipped',

  // Settings
  settings_title: 'Settings',
  settings_window: 'Sleep window',
  settings_change: 'Change window',
  settings_notifications: 'Notifications',
  settings_on: 'ON',
  settings_off: 'OFF',
  settings_eink: 'E-ink device',
  settings_device_id: 'Device ID',
  settings_api_key: 'API key',
  settings_test_card: 'Send test card',
  settings_reset: 'Reset progress',
  settings_reset_confirm: 'Reset ALL progress?',
  settings_version: 'v0.1.0',
  settings_demo_on: 'DEMO MODE ACTIVE',

  // Tutorial
  tutorial_title: 'How to play',
  tutorial_card1_title: 'Sleep to live',
  tutorial_card1_body: 'Your hero survives only while you sleep.',
  tutorial_card2_title: 'Bad nights hurt',
  tutorial_card2_body: 'Miss your window and the hero loses hearts.',
  tutorial_card3_title: 'Perfect weeks pay',
  tutorial_card3_body: '7 clean nights: level up and a loot chest.',
  tutorial_done: 'Got it',

  // Raid (P2, behind FLAGS.raids)
  raid_title: 'Campfire Raid',
  raid_body: '2-5 heroes around one campfire (Supabase, P2).',
  raid_disabled: 'Disabled: FLAGS.raids = false.',

  gallery_title: 'Art Gallery',
  gallery_body: 'QA wall: every pipeline asset, straight from assets/manifest.ts.',
  // Common
  common_back: 'Back',
  common_confirm: 'Confirm',
  common_cancel: 'Cancel',

  // Debug (temporary, M0-M1)
  debug_title: '-- Debug (temporary) --',
  debug_presets: 'State presets',
  debug_empty: 'Empty',
  debug_mid: 'Mid-game',
  debug_death: 'Death',
} as const;

export type StringKey = keyof typeof strings;
