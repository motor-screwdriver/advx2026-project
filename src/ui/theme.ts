/**
 * Design tokens (see DESIGN.md). "Cozy tavern" palette: Soul Knight's lobby
 * language — warm wood, parchment cream, honey gold, soft coral, leaf green.
 * Friendly and low-glare for the dark-bedroom scene; no pure #000/#fff.
 */
export const colors = {
  bg: '#221812', // app background, deep espresso brown
  panel: '#3a2a1c', // warm wood panel
  inset: '#2c2016', // sunken wells, buttons
  outline: '#140d08', // 2px dark coffee outlines
  bevelLight: '#5c4328', // brass top-edge bevel

  text: '#f5e6c8', // parchment cream (soft, warm — not white)
  textDim: '#c2a176', // muted tan, ≥4.5:1 on panel

  gold: '#eab54d', // honey gold: titles, primary actions, gold pixels
  leaf: '#8fc46a', // friendly green: success, streaks, positive states

  heartFull: '#ef6a5e', // soft coral red — HP semantics only
  heartFullEdge: '#ff9d8a',
  heartEmpty: '#4a3327', // empty pip as dark wood

  pixelGold: '#eab54d',
  pixelGray: '#a89b8c', // warm gray
  pixelBlack: '#1c1410', // warm black

  rareBlue: '#57a8e8', // Rare loot frame
  epicViolet: '#a179e6', // Epic loot frame
} as const;

export const GAME_FONT = 'press-start';

/**
 * Type scale. Press Start 2P is a display font: legible from ~10px up,
 * painful below. Ratio ≥1.25 between steps; generous line heights.
 */
export const type = {
  title: { fontFamily: GAME_FONT, fontSize: 18, lineHeight: 28, letterSpacing: 1 },
  body: { fontFamily: GAME_FONT, fontSize: 10, lineHeight: 18 },
  label: { fontFamily: GAME_FONT, fontSize: 8, lineHeight: 14, letterSpacing: 1 },
} as const;

export const theme = {
  colors,
  type,
  fontFamily: GAME_FONT,
  borderWidth: 2,
  borderRadius: 4,
  spacing: (units: number) => units * 4,
} as const;
