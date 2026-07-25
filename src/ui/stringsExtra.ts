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

  // Mi Fitness
  mifit_title: 'Mi Fitness',
  mifit_login: 'Login to Xiaomi account',
  mifit_region: 'Region',
  mifit_region_de: 'de - Europe',
  mifit_region_cn: 'cn - China Mainland',
  mifit_region_ru: 'ru - Russia',
  mifit_region_i2: 'i2 - India',
  mifit_region_sg: 'sg - Singapore / international',
  mifit_region_us: 'us - United States',
  mifit_region_help:
    'Use the region selected in your Mi Fitness profile, not necessarily your Xiaomi Account country. If unsure, check Mi Fitness > Profile > Settings > Region.',
  mifit_username: 'Xiaomi login',
  mifit_password: 'Password',
  mifit_connect: 'Connect',
  mifit_connecting: 'Connecting...',
  mifit_email_sent: 'Xiaomi sent a one-time code to your account email.',
  mifit_email_code: 'Email code',
  mifit_verify: 'Verify code',
  mifit_verifying: 'Verifying...',
  mifit_security:
    'We never save your Xiaomi password or email code. After login, only an encrypted session token is stored on this device so you can stay connected.',
  mifit_connected: 'Mi Fitness connected',
  mifit_saved_device: 'Saved on this device',
  mifit_disconnect: 'Disconnect',
  mifit_error_generic: 'Mi Fitness login failed.',

  // Debug (temporary, M0-M1)
  debug_title: '-- Debug (temporary) --',
  debug_presets: 'State presets',
  debug_empty: 'Empty',
  debug_mid: 'Mid-game',
  debug_death: 'Death',

  // Morning chat with Luma
  morning_chat_top_label: 'Morning Reflection',
  morning_chat_skip: 'SKIP',
  morning_chat_done: 'Continue your quest',
  morning_chat_greeting_loading: 'Luma stirs her morning tea...',
  morning_chat_error_title: 'The morning mist is thick',
  morning_chat_error_body: 'Could not reach Luma. Skip or retry.',
} as const
