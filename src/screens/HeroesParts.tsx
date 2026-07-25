import { useRouter } from 'expo-router'
import React from 'react'
import { Image, Pressable, StyleSheet, Text, View } from 'react-native'

import { BUTTONS, type SpriteEntry } from '../../assets/manifest'
import type { HeroType } from '../contracts/types'
import { strings } from '../ui/strings'
import { tavernColors, WoodPanel } from '../ui/tavern'
import { theme } from '../ui/theme'

/** Fixed card height so all 9 cards fit on one screen above the nav bar. */
const CARD_HEIGHT = 150

/**
 * Class portrait busts generated via PixelLab (see docs/8bit Sleep — гайд
 * генерация ассетов Kimi + PixelLab.md): 64px head-and-shoulders portraits on
 * a dark background, one per class. Referenced locally per screen convention
 * (not in the manifest) — the live SPRITES.hero_* idles are full-body and a
 * bad fit for bust cards. Static requires only (Metro limitation).
 */
const bust = (source: number): SpriteEntry => ({
  source,
  width: 64,
  height: 64,
  frames: 1,
  frameWidth: 64,
  frameHeight: 64,
})

const BUSTS: Record<HeroType, SpriteEntry> = {
  monk: bust(require('../../assets/design/gen/heroes_bust_monk.png')),
  ranger: bust(require('../../assets/design/gen/heroes_bust_ranger.png')),
  druid: bust(require('../../assets/design/gen/heroes_bust_druid.png')),
  rogue: bust(require('../../assets/design/gen/heroes_bust_rogue.png')),
  knight: bust(require('../../assets/design/gen/heroes_bust_knight.png')),
  paladin: bust(require('../../assets/design/gen/heroes_bust_paladin.png')),
  ninja: bust(require('../../assets/design/gen/heroes_bust_ninja.png')),
  mage: bust(require('../../assets/design/gen/heroes_bust_mage.png')),
  warlock: bust(require('../../assets/design/gen/heroes_bust_warlock.png')),
}

interface CardProps {
  type: HeroType
  condition: string
  isCurrent: boolean
}

/** Wood-framed hero card; the owned hero gets a gold frame and a YOURS tag. */
export function HeroCard({ type, condition, isCurrent }: CardProps) {
  const bust = BUSTS[type]
  return (
    <View style={[styles.card, isCurrent && styles.cardCurrent]}>
      <View style={[styles.cardBevel, isCurrent && styles.cardBevelCurrent]}>
        <View style={styles.cardWell}>
          <View style={styles.cardPortrait}>
            <Image source={bust.source} resizeMode="contain" style={styles.cardPortraitImg} />
          </View>
          <Text style={styles.cardName}>
            {strings[`hero_${type}` as keyof typeof strings].toUpperCase()}
          </Text>
          <Text style={styles.cardCondition}>{condition}</Text>
        </View>
      </View>
      {isCurrent && (
        <View style={styles.yoursTagWrap} pointerEvents="none">
          <View style={styles.yoursTag}>
            <Text style={styles.yoursText}>{strings.heroes_current.toUpperCase()}</Text>
          </View>
        </View>
      )}
    </View>
  )
}

/**
 * Bottom wood nav bar (design mockup 12-герои). Only icons that map to real
 * routes are kept: sleep → home (where SLEEP lives), shield → this screen
 * (gold-highlighted, not pressable), gear → settings.
 */
export function NavBar() {
  const router = useRouter()
  return (
    <WoodPanel rivets={false} contentStyle={styles.navWell}>
      <NavButton
        glyph="ZZZ"
        accessibilityLabel={strings.home_sleep}
        onPress={() => router.dismissTo('/')}
      />
      <View style={styles.navTile} accessibilityLabel={strings.home_nav_heroes}>
        <Image
          source={BUTTONS.chip_arrow_active.source}
          resizeMode="stretch"
          style={styles.navImage}
        />
        <Text style={styles.navGlyph}>HERO</Text>
      </View>
      <NavButton
        glyph="GEAR"
        accessibilityLabel={strings.home_nav_settings}
        onPress={() => router.push('/settings')}
      />
    </WoodPanel>
  )
}

function NavButton({
  glyph,
  onPress,
  accessibilityLabel,
}: {
  glyph: string
  onPress: () => void
  accessibilityLabel: string
}) {
  return (
    <Pressable onPress={onPress} accessibilityLabel={accessibilityLabel} style={styles.navTile}>
      {({ pressed }) => (
        <>
          <Image
            source={pressed ? BUTTONS.chip_arrow_pressed.source : BUTTONS.chip_arrow.source}
            resizeMode="stretch"
            style={styles.navImage}
          />
          <Text style={styles.navGlyph}>{glyph}</Text>
        </>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    height: CARD_HEIGHT,
    backgroundColor: tavernColors.edge,
    borderWidth: 2,
    borderColor: tavernColors.edge,
    position: 'relative',
  },
  cardCurrent: {
    borderColor: tavernColors.gold,
  },
  cardBevel: {
    flex: 1,
    borderTopWidth: 2,
    borderTopColor: tavernColors.light,
    borderBottomWidth: 2,
    borderBottomColor: tavernColors.dark,
    backgroundColor: tavernColors.mid,
    padding: theme.spacing(1),
  },
  cardBevelCurrent: {
    borderTopColor: tavernColors.goldLight,
    borderBottomColor: tavernColors.goldEdge,
    backgroundColor: tavernColors.goldEdge,
  },
  cardWell: {
    flex: 1,
    backgroundColor: '#20130b',
    alignItems: 'center',
    overflow: 'hidden',
    paddingVertical: theme.spacing(1.5),
    paddingHorizontal: theme.spacing(1),
  },
  cardPortrait: {
    flex: 1,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cardPortraitImg: {
    width: '100%',
    height: '100%',
  },
  cardName: {
    ...theme.type.label,
    color: tavernColors.gold,
  },
  cardCondition: {
    ...theme.type.label,
    fontSize: 12,
    color: theme.colors.textDim,
    textAlign: 'center',
  },
  yoursTagWrap: {
    position: 'absolute',
    bottom: -9,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  yoursTag: {
    backgroundColor: tavernColors.gold,
    borderWidth: 2,
    borderColor: tavernColors.edge,
    paddingHorizontal: theme.spacing(1.5),
    paddingVertical: 2,
  },
  yoursText: {
    ...theme.type.label,
    color: tavernColors.inkOnParchment,
  },
  navWell: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingVertical: theme.spacing(2),
  },
  navTile: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  navGlyph: {
    ...theme.type.label,
    fontSize: 10,
    color: tavernColors.gold,
    letterSpacing: 1,
  },
})
