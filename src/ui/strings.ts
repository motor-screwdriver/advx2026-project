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
  ceremony_flavor: 'Your sleep rhythm summoned it. All heroes are equal, only looks differ.',
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

  // Heroes gallery
  heroes_title: 'Heroes',
  heroes_intro: 'Your sleep window picks your hero. All heroes play the same, only looks differ.',
  heroes_early: 'Lights out before 22:00',
  heroes_normal: 'Lights out 22:00 - 23:59',
  heroes_late: 'Lights out 00:00 or later',
  heroes_dur_short: '7-8 h in bed',
  heroes_dur_mid: '8-9 h in bed',
  heroes_dur_long: '9+ h in bed',
  heroes_current: 'Yours',

  // Home
  home_title: '8bit Sleep',
  home_hearts: 'Hearts',
  home_streak: 'Perfect week',
  home_level: 'LV',
  home_window: 'Sleep window',
  home_sleep: 'Sleep',
  home_wakeup: 'Wake up',
  home_sleeping_hint: 'Hero is asleep. Tap "Wake up" when you get up!',
  home_no_hero: 'No hero yet. Complete the summoning first.',
  home_nav_mosaic: 'MOSAIC',
  home_nav_bag: 'BAG',
  home_nav_heroes: 'HEROES',
  home_nav_settings: 'SETTINGS',

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
  morning_line_perfect: 'A perfect night! Your hero is glowing.',
  morning_line_good: 'A solid night. The hero is content.',
  morning_line_bad: 'A rough night. The hero took damage.',
  morning_line_terrible: 'A disastrous night. The hero barely made it.',

  // Death & resurrection
  death_title: 'You died',
  death_body: 'The hero falls. The hearts are empty.',
  death_resurrect_cta: 'Attempt resurrection',
  death_hint: 'Soul Tether mini-game: tap when the cursor is in the golden zone.',
  death_gone: 'Your hero is gone.',
  death_new_hero: 'Summon a new hero',
  death_no_charge: 'Soul Tether is recharging (1 use per 7 days).',

  soul_title: 'Soul Tether',
  soul_round: 'Round',
  soul_instruction: 'Tap anywhere when the cursor is inside the golden zone.',
  soul_goal: 'Land 2 hits out of 3 to revive your hero.',
  soul_tap: 'Tap now!',
  soul_hit: 'Hit!',
  soul_miss: 'Miss...',
  soul_success: 'The tether holds. The hero returns.',
  soul_fail: 'The tether breaks.',

  // Mosaic
  mosaic_title: 'Year mosaic',
  mosaic_level: 'Level',
  mosaic_streak: 'Streak',
  mosaic_perfect: 'Perfect',
  mosaic_legend: 'Gold = perfect · Gray = good/bad · Black = terrible',
  mosaic_empty: 'No nights recorded yet. Sleep well tonight!',

  // Chest
  chest_title: 'Loot chest',
  chest_tap: 'Tap the chest to open it!',
  chest_none: 'No chest yet. Earn one with a Perfect Week (7 clean nights).',
  chest_earned: 'A reward for your Perfect Week.',
  chest_in_bag: 'Equip it from the Bag on the home screen.',
  chest_take: 'Take',
  rarity_common: 'Common',
  rarity_rare: 'Rare',
  rarity_epic: 'Epic',

  // Inventory
  inventory_title: 'Bag',
  inventory_hint:
    'Equip one armor and one charm below. Consumables (like Iron Armor) work on their own — no need to equip them.',
  inventory_armor: 'Armor',
  inventory_armor_desc: 'Armor slot — passive protection',
  inventory_charm: 'Charm',
  inventory_charm_desc: 'Charm slot — passive trinket',
  inventory_slot_empty: 'Nothing equipped',
  inventory_consumables: 'Items',
  inventory_empty: 'Nothing yet. Win chests with Perfect Weeks.',
  inventory_equipped: 'Equipped',
  inventory_to_armor: 'TO ARMOR',
  inventory_to_charm: 'TO CHARM',

  // Artifact descriptions
  artifact_iron_armor: 'Absorbs one HP loss, then breaks. Works automatically.',
  artifact_phoenix_feather: 'On death, auto-revives the hero at 3 HP. Works automatically.',
  artifact_hourglass: 'Upgrades one bad night from the last 24 h to GOOD.',
  artifact_lucky_coin: 'Your next chest is guaranteed Rare or better.',
  artifact_second_wind: 'First TERRIBLE night each week: -1 HP instead of -2.',
  artifact_coffee_amulet: 'Bedtime tolerance +30 min for 7 days. Coming soon.',
  artifact_alarm_bell: 'Wake-up tolerance +30 min for 7 days. Coming soon.',
  artifact_warm_blanket: 'No oversleep penalty while equipped. Coming soon.',
  artifact_night_watch: 'One missed check-in per week is auto-filled. Coming soon.',
  artifact_star_map: 'Evening hint for your ideal bedtime. Coming soon.',

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
  tutorial_card1_title: '1. Tap Sleep at night',
  tutorial_card1_body: 'Going to bed? One tap on Sleep and your hero dozes off with you.',
  tutorial_card2_title: '2. Wake up on time',
  tutorial_card2_body:
    'Tap Wake up in the morning. Nights close to your window heal and earn XP. Short or messy nights cost hearts.',
  tutorial_card3_title: '3. Survive the week',
  tutorial_card3_body:
    '7 clean nights in a row: level up plus a loot chest. At 0 hearts your hero dies. One resurrection per 7 days.',
  tutorial_done: 'Got it',

  // Raid (P2, behind FLAGS.raids)
  raid_title: 'Campfire Raid',
  raid_body: '2-5 heroes around one campfire (P2).',
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
