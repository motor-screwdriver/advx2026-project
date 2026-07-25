/**
 * Single-frame widget hero sprites (cropped by tools/pixellab_widget_frames.py —
 * RemoteViews can't show the app's 2-frame idle strips). Static requires so
 * Metro bundles them; keyed by hero type.
 */
import type { HeroType } from '../../contracts/types'

export const HERO_IMAGES: Record<HeroType, number> = {
  monk: require('../../../assets/pixellab/sprites/widget/hero_monk.png'),
  ranger: require('../../../assets/pixellab/sprites/widget/hero_ranger.png'),
  druid: require('../../../assets/pixellab/sprites/widget/hero_druid.png'),
  rogue: require('../../../assets/pixellab/sprites/widget/hero_rogue.png'),
  knight: require('../../../assets/pixellab/sprites/widget/hero_knight.png'),
  paladin: require('../../../assets/pixellab/sprites/widget/hero_paladin.png'),
  ninja: require('../../../assets/pixellab/sprites/widget/hero_ninja.png'),
  mage: require('../../../assets/pixellab/sprites/widget/hero_mage.png'),
  warlock: require('../../../assets/pixellab/sprites/widget/hero_warlock.png'),
}
