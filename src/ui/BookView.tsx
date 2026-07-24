import { Image as ExpoImage } from 'expo-image'
import React from 'react'
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native'

import { SCENES, SPRITES_1BIT } from '../../assets/manifest'
import type { HeroType } from '../contracts/types'
import { HeroSprite } from './HeroSprite'
import { PixelSprite } from './PixelSprite'
import { strings } from './strings'
import { tavernColors } from './tavern'
import { theme } from './theme'

const PAGE = SCENES.book_page
const ASPECT = PAGE.width / PAGE.height // 180 / 360 = 0.5, matches phone aspect
const MAX_HP = 7

// The art is one flat ornate page filling the frame: a gold illuminated
// border with corner flourishes, a medallion at the top and a heraldic shield
// at the bottom. These fractions of the book rect frame the clean cream area
// between those ornaments (measured in tools/pixellab_book.py output) so the
// stats + hero never collide with the decorations.
const PAGE_L = 0.13
const PAGE_W = 0.74
const PAGE_T = 0.17
const PAGE_H = 0.57

interface Stats {
  hp: number
  level: number
  streak: number
}

/** HP pips + LV + XP + HP text, all drawn in ink on the parchment. */
function PageStats({ hp, level, streak, heart }: Stats & { heart: number }) {
  const pct = Math.max(0, Math.min(1, streak / MAX_HP))
  return (
    <View style={styles.stats}>
      <View style={styles.hearts}>
        {Array.from({ length: MAX_HP }, (_, i) => (
          <PixelSprite
            key={i}
            sprite={i < hp ? SPRITES_1BIT['1bit_heart_full'] : SPRITES_1BIT['1bit_heart_empty']}
            size={heart}
          />
        ))}
      </View>
      <Text style={styles.lv}>
        {strings.home_level} {level}
      </Text>
      <View style={styles.xpTrack}>
        <View style={[styles.xpFill, { width: `${pct * 100}%` }]} />
      </View>
      <Text style={styles.hp}>
        HP {hp}/{MAX_HP}
      </Text>
    </View>
  )
}

/**
 * The awake "character sheet": one flat, richly illuminated parchment page
 * lying straight on the table and filling the screen — stats inked across the
 * top of the page, the hero sketched large in 1-bit ink below. The art is
 * generated near phone aspect, so cover-fitting it loses almost nothing;
 * content is positioned as fractions of the book rect so it always rides the
 * parchment regardless of screen aspect. Reused as the transition's opening
 * frame, then wiped away to reveal the living night world.
 */
export function BookView({ heroType, hp, level, streak }: Stats & { heroType: HeroType | null }) {
  const { width: W, height: H } = useWindowDimensions()
  const bookW = Math.max(W, H * ASPECT)
  const bookH = bookW / ASPECT
  const heroSize = Math.min(bookW * 0.5, bookH * 0.28)
  const heart = Math.round(bookW * 0.07)
  return (
    <View style={styles.root}>
      <View style={{ width: bookW, height: bookH }}>
        <ExpoImage
          source={PAGE.source}
          style={StyleSheet.absoluteFill}
          contentFit="fill"
          transition={300}
        />
        <View
          pointerEvents="none"
          style={[
            styles.page,
            {
              left: bookW * PAGE_L,
              width: bookW * PAGE_W,
              top: bookH * PAGE_T,
              height: bookH * PAGE_H,
            },
          ]}
        >
          <PageStats hp={hp} level={level} streak={streak} heart={heart} />
          <View style={styles.heroWrap}>
            {heroType ? (
              <HeroSprite type={heroType} size={heroSize} animated fps={2} oneBit />
            ) : null}
          </View>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.bg,
  },
  page: { position: 'absolute', alignItems: 'center', gap: theme.spacing(2) },
  stats: { alignItems: 'center', gap: theme.spacing(1.5), width: '100%' },
  hearts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: theme.spacing(1),
  },
  lv: {
    fontFamily: theme.fontFamily,
    fontSize: 14,
    letterSpacing: 1,
    color: tavernColors.inkOnParchment,
  },
  xpTrack: {
    width: '76%',
    height: 10,
    borderWidth: 2,
    borderColor: tavernColors.inkOnParchment,
    backgroundColor: 'transparent',
  },
  xpFill: { height: '100%', backgroundColor: tavernColors.inkOnParchment },
  hp: {
    fontFamily: theme.fontFamily,
    fontSize: 11,
    letterSpacing: 1,
    color: tavernColors.inkOnParchment,
  },
  heroWrap: { flex: 1, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' },
})
