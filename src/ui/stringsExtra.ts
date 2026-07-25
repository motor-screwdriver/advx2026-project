/**
 * Secondary-screen and debug strings, split from strings.ts to keep every
 * file under the 250-line lint cap. Merged into `strings` there — consumers
 * still import a single flat object.
 */
export const stringsExtra = {
  // Onboarding duration warnings
  onboarding_min_hours: 'Minimum 7 hours',
  onboarding_max_hours: 'Maximum 12 hours',

  // Sleep journal
  journal_title: 'Sleep journal',
  journal_empty: 'No nights recorded yet. Your story starts tonight!',
  journal_no_checkin: 'No check-in recorded',
  journal_score: 'Score',

  // Guide ("How it works" memo)
  guide_title: 'How it works',
  guide_window_title: 'Your sleep window',
  guide_window_body:
    'The bed and wake times your hero judges every night by. Stay close for a perfect score.',
  guide_scoring_title: 'Night score',
  guide_scoring_start: 'Every night starts at 100 points.',
  guide_scoring_penalties:
    'Late or early bed/wake-up: up to -30 each. Short sleep: up to -40. Oversleeping the window by 2 h or more: -10.',
  guide_scoring_bands:
    '85+ PERFECT: +1 HP, 100 XP. 60+ GOOD: 60 XP. 40+ BAD: -1 HP, 25 XP. Below 40 TERRIBLE: -2 HP.',
  guide_scoring_streak: '7 clean nights in a row: level up + loot chest. At 0 HP the hero dies.',
  guide_reminders_title: 'Reminders',
  guide_reminders_body:
    'Bedtime push 1 h before your window. Wake reminder pinned in the shade while the hero sleeps. Morning summary 15 min after wake time. Toggle in Settings.',

  // Debug (temporary, M0-M1)
  debug_title: '-- Debug (temporary) --',
  debug_presets: 'State presets',
  debug_empty: 'Empty',
  debug_mid: 'Mid-game',
  debug_death: 'Death',

  // Inventory badges (split from strings.ts for line cap)
  inventory_badge_auto: 'AUTO',
  inventory_badge_active: 'ACTIVE',
  inventory_badge_next_chest: 'NEXT CHEST',

  // Equip slot picker
  equip_current: 'CURRENTLY EQUIPPED',
  equip_available: 'AVAILABLE GEAR',
  equip_none: 'No equipment in your bag yet.',
  equip_cta: 'EQUIP',
  equip_in_other: 'In',
  equip_charm_empty: 'Charms and skins will appear in future updates.',

  // Utility picker sections
  util_section_equippable: 'EQUIPPABLE GEAR',
  util_section_tools: 'TOOLS & ITEMS',

  // Utility feedback alerts
  util_alert_hourglass_ok: 'Night upgraded to GOOD!',
  util_alert_hourglass_fail: 'No recent rough night to rewrite.',
  util_alert_lucky_coin: 'Lucky Coin will bless your next chest automatically.',
  util_alert_phoenix: 'The feather awakens only when the hero falls.',
  util_alert_timed_active: 'Active — effect running.',
  util_badge_next_chest: 'NEXT CHEST',
  util_badge_on_death: 'ON DEATH',

  // Phoenix / Death
  phoenix_offer: 'USE PHOENIX FEATHER',
  phoenix_rise: 'RISE FROM THE ASHES',
  phoenix_gone: 'The phoenix has flown. No feather remains.',
} as const
