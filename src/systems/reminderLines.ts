/**
 * Notification copy (P0). PROMPT D keeps this pool hardcoded in systems:
 * pushes fire while the app is not running, so they cannot depend on the
 * UI layer. Hero persona, English only.
 */
export const NOTIF_TITLE = '8bit Sleep';

/** Bedtime reminder pool — one per day, rotated deterministically. */
export const BEDTIME_LINES = [
  'Your hero waits by the campfire. Don’t leave him out in the cold.',
  'The dungeon closes in an hour. Your hero needs you in bed.',
  'Seven hearts won’t survive another late night. Sleep calls.',
  'Your hero polished his sword all day. Rest, so he can rest.',
  'The campfire is warm, the bed is near. Your hero is waiting.',
  'Monsters farm HP while you doomscroll. Go to sleep instead.',
  'One clean night = one step to the next level. Lights out soon.',
  'Your hero already laid out your blanket. Don’t stand him up.',
  'The night watch starts soon. Your hero takes it only if you sleep.',
  'Bedtime in an hour. Heroes grow while mortals sleep.',
] as const;

export const MORNING_SUMMARY_BODY = 'Your hero survived the night. See what happened.';
