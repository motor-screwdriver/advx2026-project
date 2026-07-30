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
import { STRIP_TILES } from './journeyLayout'

/** One square forest tile glides past in this long — a calm night stroll. */
const TILE_MS = 10000

/**
 * The journey viewport: a static starry-sky backdrop with the seamless
 * five-tile forest strip scrolling right-to-left in front of it — the
 * carousel that reads as the hero walking through the night woods.
 * Two copies of the strip leapfrog on the UI-thread clock (reanimated),
 * so the loop never stutters over JS work.
 */
export function JourneyCarousel() {
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
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  viewport: { flex: 1, overflow: 'hidden' },
  strip: { ...StyleSheet.absoluteFillObject, flexDirection: 'row' },
})
