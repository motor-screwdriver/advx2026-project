import { Image as ExpoImage } from 'expo-image'
import React, { useEffect, useState } from 'react'
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'

import { JOURNEY } from '../../../assets/manifest'
import type { HeroType } from '../../contracts/types'
import { HeroSprite } from '../HeroSprite'
import { HERO_SOLE, STRIP_GROUND, STRIP_TILES } from './journeyLayout'

/** One square forest tile glides past in this long — a calm night stroll. */
const TILE_MS = 10000
/** Hero frame height, as a fraction of the viewport — puts him a bit taller
 * than the undergrowth and well under the pines. */
const HERO_SCALE = 0.52
/** Walk cycle speed. Reads as a stroll against the tile scroll above. */
const HERO_FPS = 8

/**
 * The journey viewport: a static starry-sky backdrop with the seamless
 * five-tile forest strip scrolling right-to-left in front of it, and the hero
 * walking in place on the grass line — the carousel that reads as him walking
 * through the night woods. Two copies of the strip leapfrog on the UI-thread
 * clock (reanimated), so the loop never stutters over JS work.
 */
export function JourneyCarousel({ hero }: { hero: HeroType }) {
  const [frame, setFrame] = useState({ width: 0, height: 0 })
  // Tiles are square, so a strip drawn at viewport height is TILES x height wide.
  const stripWidth = frame.height * STRIP_TILES
  const offset = useSharedValue(0)

  useEffect(() => {
    if (stripWidth === 0) {
      return
    }
    offset.value = 0
    offset.value = withRepeat(
      withTiming(-stripWidth, {
        duration: TILE_MS * STRIP_TILES,
        easing: Easing.linear,
      }),
      -1,
    )
  }, [offset, stripWidth])

  const scroll = useAnimatedStyle(() => ({ transform: [{ translateX: offset.value }] }))
  const onLayout = (event: LayoutChangeEvent) => setFrame(event.nativeEvent.layout)

  // Walk frames are square, so the frame's rendered width is its height too;
  // dropping the sprite's empty rows under the boots plants him on the grass.
  const heroSize = frame.height * HERO_SCALE
  const heroTop = frame.height * STRIP_GROUND - heroSize * HERO_SOLE

  return (
    <View style={styles.viewport} onLayout={onLayout}>
      <ExpoImage
        source={JOURNEY.sky.source}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        cachePolicy="memory-disk"
        transition={0}
      />
      {stripWidth > 0 && (
        <>
          <Animated.View style={[styles.strip, scroll]}>
            {[0, 1].map((copy) => (
              <ExpoImage
                key={copy}
                source={JOURNEY.forest_strip.source}
                style={{ width: stripWidth, height: frame.height }}
                contentFit="fill"
                cachePolicy="memory-disk"
                transition={0}
              />
            ))}
          </Animated.View>
          <View style={[styles.hero, { top: heroTop }]} pointerEvents="none">
            <HeroSprite type={hero} size={heroSize} walking fps={HERO_FPS} />
          </View>
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  viewport: { flex: 1, overflow: 'hidden' },
  strip: { ...StyleSheet.absoluteFillObject, flexDirection: 'row' },
  hero: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
})
