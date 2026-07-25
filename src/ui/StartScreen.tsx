import { Image as ExpoImage } from 'expo-image'
import React from 'react'
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native'

import { SCENES } from '../../assets/manifest'
import { StartStatusStrip } from './StartStatusStrip'
import { strings } from './strings'

// The awake home is one authored 9:16 phone screen (docs/start_screen, published
// by tools/start_screen.py): the storybook on a candle-lit table with the SLEEP
// and MOSAIC/BAG/SETTINGS plaques and the empty HP strip already drawn in. The
// UI adds only what changes — the hero's hearts/level, and the darker pressed
// art of whichever plaque is held down.
//
// One static frame only: the alternate book_frame was a candle flicker that
// forced two ~8MP bitmaps to composite every 500ms and made the gold cover
// clouds look like a 2fps stutter, especially during wipe navigation.
const BOOK = SCENES.start_book_frame_1
const ASPECT = BOOK.width / BOOK.height // 2160 / 3840

interface Rect {
  l: number
  t: number
  w: number
  h: number
}

const PLAQUES: Record<'sleep' | 'mosaic' | 'bag' | 'settings', Rect> = {
  sleep: { l: 188 / 2160, t: 2608 / 3840, w: 1785 / 2160, h: 489 / 3840 },
  mosaic: { l: 95 / 2160, t: 3175 / 3840, w: 633 / 2160, h: 511 / 3840 },
  bag: { l: 772 / 2160, t: 3182 / 3840, w: 624 / 2160, h: 507 / 3840 },
  settings: { l: 1446 / 2160, t: 3176 / 3840, w: 616 / 2160, h: 510 / 3840 },
}

const PRESSED = {
  sleep: SCENES.start_sleep_pressed,
  mosaic: SCENES.start_mosaic_pressed,
  bag: SCENES.start_bag_pressed,
  settings: SCENES.start_settings_pressed,
}

/** Labels are painted into the art; these name the plaques for screen readers. */
const LABELS = {
  sleep: strings.home_sleep,
  mosaic: strings.home_nav_mosaic,
  bag: strings.home_nav_bag,
  settings: strings.home_nav_settings,
}

/** The HP strip drawn across the top of the backdrop, inside its brass rim. */
const STRIP_RECT = { l: 46 / 2160, t: 44 / 3840, w: 2076 / 2160, h: 291 / 3840 }

interface Props {
  hp: number
  level: number
  onSleep?: () => void
  onBag?: () => void
  onMosaic?: () => void
  onSettings?: () => void
}

/** Absolute frame for a rect of the backdrop, in on-screen px. */
function place({ l, t, w, h }: Rect, bookW: number, bookH: number) {
  return {
    position: 'absolute' as const,
    left: bookW * l,
    top: bookH * t,
    width: bookW * w,
    height: bookH * h,
  }
}

/** A plaque painted into the backdrop: a hit area over the resting art with the
 * designer's darker pressed version laid on top, revealed while it's held down.
 * The overlay stays mounted so the very first tap can't catch it still loading. */
function Plaque({
  name,
  bookW,
  bookH,
  onPress,
}: {
  name: keyof typeof PLAQUES
  bookW: number
  bookH: number
  onPress?: () => void
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={LABELS[name]}
      disabled={!onPress}
      onPress={onPress}
      style={place(PLAQUES[name], bookW, bookH)}
    >
      {({ pressed }) => (
        <ExpoImage
          source={PRESSED[name].source}
          style={[StyleSheet.absoluteFill, { opacity: pressed ? 1 : 0 }]}
          contentFit="fill"
          cachePolicy="memory-disk"
          transition={0}
        />
      )}
    </Pressable>
  )
}

/**
 * The awake home / start screen. The backdrop is fitted to the full width and
 * centred, never cropped — the plaques run almost to the edges of the art, and
 * on taller phones the letterboxed strips read as the dark table continuing
 * behind the notch and the home indicator.
 *
 * Nav handlers are optional; without them (sleep transition opening frame) the
 * plaques render as plain art.
 */
export function StartScreen({ hp, level, onSleep, onBag, onMosaic, onSettings }: Props) {
  const { width: W, height: H } = useWindowDimensions()
  const bookW = Math.min(W, H * ASPECT)
  const bookH = bookW / ASPECT
  return (
    <View style={styles.root}>
      <View style={{ width: bookW, height: bookH }}>
        <ExpoImage
          source={BOOK.source}
          style={StyleSheet.absoluteFill}
          contentFit="fill"
          cachePolicy="memory-disk"
          transition={0}
          priority="high"
        />
        <View style={place(STRIP_RECT, bookW, bookH)} pointerEvents="none">
          <StartStatusStrip hp={hp} level={level} height={bookH * STRIP_RECT.h} />
        </View>
        <Plaque name="sleep" bookW={bookW} bookH={bookH} onPress={onSleep} />
        <Plaque name="mosaic" bookW={bookW} bookH={bookH} onPress={onMosaic} />
        <Plaque name="bag" bookW={bookW} bookH={bookH} onPress={onBag} />
        <Plaque name="settings" bookW={bookW} bookH={bookH} onPress={onSettings} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    // The art fades to black at every edge, so the letterbox is the same table.
    backgroundColor: '#000000',
  },
})
