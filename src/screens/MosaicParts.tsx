import React from 'react'
import { Image, ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native'

import type { PixelColor } from '../contracts/types'
import { strings } from '../ui/strings'
import { theme } from '../ui/theme'

const copy = { share: 'SHARE', lv: 'LV', star: '★' } as const

/** Assets sliced from the mockup sprite by tools/mosaic_slice.py. */
const BG = require('../../assets/design/gen/mosaic/bg.png')
const BTN_BACK = require('../../assets/design/gen/mosaic/btn_back.png')
const BTN_BACK_PRESSED = require('../../assets/design/gen/mosaic/btn_back_pressed.png')
const TILES: Record<PixelColor, number> = {
  GOLD: require('../../assets/design/gen/mosaic/tile_perfect.png'),
  GRAY: require('../../assets/design/gen/mosaic/tile_good.png'),
  BLACK: require('../../assets/design/gen/mosaic/tile_bad.png'),
}

/**
 * Geometry measured in the 2160x3840 mockup sprite (see tools/mosaic_slice.py).
 * Everything on screen is the mockup itself: the title, empty plaques, the
 * 18x18 socket grid, the legend and the SHARE plate are baked into BG; we only
 * overlay plaque values, one tile sprite per recorded night and a share hotspot.
 */
const SRC = {
  w: 2160,
  h: 3840,
  /**
   * Text areas = the plaque's bright wooden face (y 510..755 in the sprite).
   * The full frame spans 491..872, but its lower half is a dark recess, so
   * centering over the whole frame pushed text visually below the middle.
   */
  plaques: [
    { x: 145, y: 507, w: 560, h: 250 },
    { x: 784, y: 507, w: 574, h: 250 },
    { x: 1437, y: 507, w: 580, h: 250 },
  ],
  grid: { x: 279, y: 1024, pitchX: 90.35, pitchY: 98.88, cols: 18, rows: 18 },
  tile: { w: 93, h: 95 },
  share: { x: 440, y: 3200, w: 1280, h: 500 },
  /** BACK sprite (504x208 png) drawn at this size in sheet coordinates. */
  back: { w: 1008, h: 416 },
  /** Uniform for all plaques; sized so the longest value (PERFECT 100%) fits. */
  fontPx: 50,
} as const

/** Days the mockup board can display (18x18 sockets). */
export const MOSAIC_CAPACITY = SRC.grid.cols * SRC.grid.rows

interface SheetProps {
  width: number
  level: number
  streak: number
  perfectPct: number
  nights: { pixel: PixelColor }[]
  onShare: () => void
}

/** One plaque's centered value text, absolutely positioned over the baked frame. */
function PlaqueValue({
  rect,
  k,
  children,
}: {
  rect: { x: number; y: number; w: number; h: number }
  k: number
  children: React.ReactNode
}) {
  return (
    <View
      style={[
        styles.plaque,
        { left: rect.x * k, top: rect.y * k, width: rect.w * k, height: rect.h * k },
      ]}
    >
      <Text
        style={[styles.plaqueText, { fontSize: SRC.fontPx * k, lineHeight: SRC.fontPx * k * 1.15 }]}
        numberOfLines={2}
      >
        {children}
      </Text>
    </View>
  )
}

/** Sprite BACK button matching the sheet style; swaps art while pressed. */
export function MosaicBackButton({ width, onPress }: { width: number; onPress: () => void }) {
  const k = width / SRC.w
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={strings.common_back}
      onPress={onPress}
    >
      {({ pressed }) => (
        <Image
          source={pressed ? BTN_BACK_PRESSED : BTN_BACK}
          style={{ width: SRC.back.w * k, height: SRC.back.h * k }}
          resizeMode="stretch"
        />
      )}
    </Pressable>
  )
}

/**
 * The full Year Mosaic sheet: the mockup sprite as background plus dynamic
 * overlays. Tiles fill the baked sockets night by night, left to right.
 */
export function MosaicSheet({ width, level, streak, perfectPct, nights, onShare }: SheetProps) {
  const k = width / SRC.w
  const { grid, tile, share } = SRC
  const values = [
    `${copy.star} ${copy.lv} ${level} ${copy.star}`,
    `${strings.mosaic_streak.toUpperCase()}\n${streak}`,
    `${strings.mosaic_perfect.toUpperCase()}\n${perfectPct}%`,
  ]

  return (
    <ImageBackground source={BG} style={{ width, height: SRC.h * k }}>
      {SRC.plaques.map((rect, i) => (
        <PlaqueValue key={i} rect={rect} k={k}>
          {values[i]}
        </PlaqueValue>
      ))}
      {nights.slice(0, MOSAIC_CAPACITY).map((night, i) => (
        <Image
          key={i}
          source={TILES[night.pixel]}
          style={{
            position: 'absolute',
            left: (grid.x + (i % grid.cols) * grid.pitchX) * k,
            top: (grid.y + Math.floor(i / grid.cols) * grid.pitchY) * k,
            width: tile.w * k,
            height: tile.h * k,
          }}
          resizeMode="stretch"
        />
      ))}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={copy.share}
        onPress={onShare}
        style={({ pressed }) => [
          {
            position: 'absolute',
            left: share.x * k,
            top: share.y * k,
            width: share.w * k,
            height: share.h * k,
          },
          pressed && styles.sharePressed,
        ]}
      />
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  plaque: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  plaqueText: {
    fontFamily: theme.fontFamily,
    color: '#e8c77f',
    letterSpacing: 1,
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  sharePressed: {
    backgroundColor: '#00000030',
  },
})
