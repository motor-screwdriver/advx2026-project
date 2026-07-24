/**
 * Single-frame widget hero sprites (cropped by tools/pixellab_widget_frames.py —
 * RemoteViews can't show the app's 2-frame idle strips). Static requires so
 * Metro bundles them; keyed by hero type, normal and perfect-week gold skins.
 */
import type { HeroType } from '../../contracts/types'

export const HERO_IMAGES: Record<HeroType, { normal: number; gold: number }> = {
  monk: {
    normal: require('../../../assets/pixellab/sprites/widget/hero_monk.png'),
    gold: require('../../../assets/pixellab/sprites/widget/hero_monk_gold.png'),
  },
  ranger: {
    normal: require('../../../assets/pixellab/sprites/widget/hero_ranger.png'),
    gold: require('../../../assets/pixellab/sprites/widget/hero_ranger_gold.png'),
  },
  druid: {
    normal: require('../../../assets/pixellab/sprites/widget/hero_druid.png'),
    gold: require('../../../assets/pixellab/sprites/widget/hero_druid_gold.png'),
  },
  rogue: {
    normal: require('../../../assets/pixellab/sprites/widget/hero_rogue.png'),
    gold: require('../../../assets/pixellab/sprites/widget/hero_rogue_gold.png'),
  },
  knight: {
    normal: require('../../../assets/pixellab/sprites/widget/hero_knight.png'),
    gold: require('../../../assets/pixellab/sprites/widget/hero_knight_gold.png'),
  },
  paladin: {
    normal: require('../../../assets/pixellab/sprites/widget/hero_paladin.png'),
    gold: require('../../../assets/pixellab/sprites/widget/hero_paladin_gold.png'),
  },
  ninja: {
    normal: require('../../../assets/pixellab/sprites/widget/hero_ninja.png'),
    gold: require('../../../assets/pixellab/sprites/widget/hero_ninja_gold.png'),
  },
  mage: {
    normal: require('../../../assets/pixellab/sprites/widget/hero_mage.png'),
    gold: require('../../../assets/pixellab/sprites/widget/hero_mage_gold.png'),
  },
  warlock: {
    normal: require('../../../assets/pixellab/sprites/widget/hero_warlock.png'),
    gold: require('../../../assets/pixellab/sprites/widget/hero_warlock_gold.png'),
  },
}
