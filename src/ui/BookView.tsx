import { Image as ExpoImage } from 'expo-image'
import React, { useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native'

import { SCENES, SPRITES_1BIT } from '../../assets/manifest'
import type { HeroType } from '../contracts/types'
import { HeroSprite } from './HeroSprite'
import { PixelSprite } from './PixelSprite'
import { strings } from './strings'
import { tavernColors } from './tavern'
import { theme } from './theme'

// Candle-flicker backdrop: 7 hand-tuned frames of the blank book page whose
// glow breathes (docs/book_menu, pixelated + published by tools/book_menu.py).
const FRAMES = [
  SCENES.book_menu_1,
  SCENES.book_menu_2,
  SCENES.book_menu_3,
  SCENES.book_menu_4,
  SCENES.book_menu_5,
  SCENES.book_menu_6,
  SCENES.book_menu_7,
]
const ASPECT = FRAMES[0].width / FRAMES[0].height // 540 / 960
const FLICKER_MS = 130
const MAX_HP = 7
const INK = tavernColors.inkOnParchment

// ONE pixel unit for the whole page: PX = 1/135 of the book width, the size a
// 64px-art hero pixel lands on. Every ink element snaps to it: hero at 64·PX,
// big script at 16·PX, small script + hearts (16px art) at 8·PX — the two
// classic 8-bit tiers. The backdrop itself sits on a 108-wide art grid, i.e.
// its pixels are 1.25× the hero pixel — deliberately a touch chunkier so the
// page never reads finer than the sprites drawn on it.
const BOOK_GRID_W = 135

// The right page of the book art. Fractions of the book rect framing the
// clean parchment so hero, stats and buttons never spill onto wood or candle.
const PAGE_L = 0.16
const PAGE_W = 0.72
const PAGE_T = 0.19
const PAGE_H = 0.63

interface Stats {
  hp: number
  level: number
  streak: number
}

interface Nav {
  onSleep?: () => void
  onBag?: () => void
  onMosaic?: () => void
  onSettings?: () => void
  onSleepPlan?: () => void
}

/** Cycles 0..count-1 to page the flicker frames. */
function useFlicker(count: number, ms: number) {
  const [frame, setFrame] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setFrame((f) => (f + 1) % count), ms)
    return () => clearInterval(id)
  }, [count, ms])
  return frame
}

/** HP pips + LV + XP + HP text, quill-written in ink on the parchment. */
function PageStats({ hp, level, streak, px }: Stats & { px: number }) {
  const pct = Math.max(0, Math.min(1, streak / MAX_HP))
  return (
    <View style={styles.stats} pointerEvents="none">
      <View style={styles.hearts}>
        {Array.from({ length: MAX_HP }, (_, i) => (
          <PixelSprite
            key={i}
            sprite={i < hp ? SPRITES_1BIT['1bit_heart_full'] : SPRITES_1BIT['1bit_heart_empty']}
            size={px * 8}
          />
        ))}
      </View>
      <Text style={[styles.lv, { fontSize: px * 8, lineHeight: px * 9 }]}>
        {strings.home_level} {level}
      </Text>
      <View
        style={[
          styles.xpTrack,
          { height: px * 3, borderWidth: Math.max(2, Math.round(px * 0.75)) },
        ]}
      >
        <View style={[styles.xpFill, { width: `${pct * 100}%` }]} />
      </View>
      <Text style={[styles.hp, { fontSize: px * 8, lineHeight: px * 9 }]}>
        HP {hp}/{MAX_HP}
      </Text>
    </View>
  )
}

/** A page "button": a quill-script entry on the page; ink only, no frame. */
function InkButton({
  label,
  size,
  onPress,
}: {
  label: string
  size: number
  onPress?: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      hitSlop={12}
      style={({ pressed }) => [styles.inkBtn, pressed && styles.inkBtnPressed]}
    >
      <Text style={[styles.script, { fontSize: size, lineHeight: Math.round(size * 1.1) }]}>
        {label}
      </Text>
    </Pressable>
  )
}

/**
 * The awake home: a living book page lit by a breathing candle (7 pixelated
 * flicker frames cycled), with everything quill-written on the parchment at
 * render time — the hero standing motionless in 1-bit ink, his HP/XP, and
 * below them the nav entries in pixel blackletter script. Nav handlers are
 * optional; without them (sleep transition opening frame) the entries render
 * as plain ink.
 */
export function BookView(props: Stats & Nav & { heroType: HeroType | null }) {
  const { heroType, hp, level, streak, onSleep, onBag, onMosaic, onSettings, onSleepPlan } = props
  const { width: W, height: H } = useWindowDimensions()
  const frame = useFlicker(FRAMES.length, FLICKER_MS)
  const bookW = Math.max(W, H * ASPECT)
  const bookH = bookW / ASPECT
  const px = Math.max(2, Math.round(bookW / BOOK_GRID_W))
  const heroSize = px * 64
  return (
    <View style={styles.root}>
      <View style={{ width: bookW, height: bookH }}>
        {FRAMES.map((f, i) => (
          <ExpoImage
            key={i}
            source={f.source}
            style={[StyleSheet.absoluteFill, { opacity: i === frame ? 1 : 0 }]}
            contentFit="fill"
          />
        ))}
        <View
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
          <PageStats hp={hp} level={level} streak={streak} px={px} />
          <View style={styles.heroWrap} pointerEvents="none">
            {heroType ? (
              <HeroSprite type={heroType} size={heroSize} animated={false} oneBit />
            ) : null}
          </View>
          <View style={styles.buttons}>
            <InkButton label={strings.home_sleep} size={px * 16} onPress={onSleep} />
            <View style={styles.btnRow}>
              <InkButton label={strings.home_nav_bag} size={px * 8} onPress={onBag} />
              <InkButton label={strings.home_nav_mosaic} size={px * 8} onPress={onMosaic} />
              <InkButton label={strings.home_nav_settings} size={px * 8} onPress={onSettings} />
            </View>
            {onSleepPlan && (
              <InkButton label={strings.sleep_plan_button} size={px * 8} onPress={onSleepPlan} />
            )}
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
    color: INK,
  },
  // Hand-ruled ink bar: a hair of skew keeps it looking quill-drawn.
  xpTrack: {
    width: '70%',
    borderColor: INK,
    backgroundColor: 'transparent',
    transform: [{ rotate: '-0.6deg' }],
  },
  xpFill: { height: '100%', backgroundColor: INK },
  hp: {
    fontFamily: theme.fontFamily,
    color: INK,
  },
  heroWrap: { flex: 1, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' },
  buttons: { alignSelf: 'stretch', alignItems: 'center', gap: theme.spacing(2) },
  btnRow: { flexDirection: 'row', justifyContent: 'center', gap: theme.spacing(6) },
  inkBtn: { alignItems: 'center', justifyContent: 'center' },
  inkBtnPressed: { transform: [{ scale: 0.94 }] },
  script: { fontFamily: theme.fontFamily, color: INK, textAlign: 'center' },
})
