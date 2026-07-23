/**
 * Hand-authored pixel-art bitmaps for the home scene. Each is an array of
 * equal-length strings consumed by <PixelArt />. Legend:
 *   ' ' transparent   'W' cloud body   's' cloud shade
 *   'O' orb body       'd' orb shade    'h' orb highlight
 *   'B' bright blade   'D' dark blade
 *   'p' petal          'y' flower core  'g' stem
 * Colours are supplied per phase at render time via the `map`.
 */

export const CLOUD_BIG = [
  '    WWWWWW    ',
  '  WWWWWWWWWW  ',
  ' WWWWWWWWWWWW ',
  'WWWWWWWWWWWWWW',
  'WWWWWWWWWWWWWW',
  'sWWWWWWWWWWWWs',
  ' ssssssssssss ',
] as const;

export const CLOUD_SMALL = ['  WWWW  ', ' WWWWWW ', 'WWWWWWWW', 'sWWWWWWs', ' ssssss '] as const;

export const CLOUD_WISP = ['  WWWWW ', ' WWWWWWW', ' sWWWWs '] as const;

/** Slightly irregular disc so the edge reads pixel-round, not geometric. */
export const SUN = [
  '    OOOO    ',
  '  OOOOOOOO  ',
  ' OOhhOOOOOO ',
  ' OhhOOOOOOO ',
  'OOhOOOOOOOOd',
  'OOOOOOOOOOdd',
  'OOOOOOOOOddd',
  'OOOOOOOOdddd',
  ' OOOOOOOddd ',
  ' OOOOOdddd  ',
  '  OOddddd   ',
  '    dddd    ',
] as const;

export const MOON = [
  '    OOOO    ',
  '  OOOOOOdd  ',
  ' OhOOOOdddd ',
  ' OOOOOddddd ',
  'OOOOOOdddddd',
  'OOOOOddddddd',
  'OOOOOddddddd',
  'OOOOOOdddddd',
  ' OOOOOddddd ',
  ' OOOOOdddd  ',
  '  OOOOddd   ',
  '    OOOd    ',
] as const;

/** Single grass tuft — thin blades of differing height. */
export const TUFT = [
  'B  D  B  ',
  'B  D  B B',
  'BD DB DBB',
  'BDBDBDBDB',
  'DBDBDBDBD',
  ' DBDBDBD ',
] as const;

export const FLOWER = [' p p ', 'ppypp', ' ppp ', '  g  ', '  g  ', ' Dg  '] as const;
