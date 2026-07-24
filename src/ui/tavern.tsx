/**
 * Tavern UI kit — barrel export. The shared visual language of the
 * docs/images_full design mockups: dark espresso background, wood panels with
 * brass rivets, parchment insets, honey-gold buttons and titles. Use these
 * primitives instead of one-off styled Views when building screens.
 *
 * Layout idiom: screens are a vertical stack of panels on <TavernFrame>,
 * titles via <ScreenTitle>, primary actions via <GoldButton>, secondary via
 * <WoodButton>, content wells via <WoodPanel> / <Parchment>.
 *
 * Implementation is split into tavernBase (colors, frame, panels) and
 * tavernControls (buttons, badge, bar) to satisfy the repo's max-lines rule;
 * import everything from here.
 */

export * from './tavernBase'
export * from './tavernControls'
