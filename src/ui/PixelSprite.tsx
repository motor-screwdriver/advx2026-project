import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, View, type ImageStyle, type StyleProp } from 'react-native';

import type { SpriteEntry } from '../../assets/manifest';

interface Props {
  sprite: SpriteEntry;
  /** Rendered width of a single frame, in px. Height scales to keep aspect. */
  size?: number;
  /** Static frame index (ignored while `animated`). */
  frame?: number;
  /** Cycle through the strip's frames on a loop. */
  animated?: boolean;
  /** Animation speed in frames per second. */
  fps?: number;
  style?: StyleProp<ImageStyle>;
}

/**
 * Renders one frame of a manifest sprite strip. Multi-frame assets are
 * horizontal strips (frameWidth x frameHeight per frame); we scale the whole
 * strip and clip to a single frame with a translated <Image> inside an
 * overflow-hidden window — no extra deps, crisp for our pre-upscaled art.
 */
export function PixelSprite({ sprite, size = 64, frame = 0, animated = false, fps = 2, style }: Props) {
  const { frames, frameWidth, frameHeight } = sprite;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!animated || frames <= 1) {
      return;
    }
    const id = setInterval(() => setIndex((i) => (i + 1) % frames), 1000 / fps);
    return () => clearInterval(id);
  }, [animated, frames, fps]);

  const current = animated && frames > 1 ? index : Math.min(Math.max(frame, 0), frames - 1);
  const dispH = (size * frameHeight) / frameWidth;
  return (
    <View style={[styles.window, { width: size, height: dispH }]}>
      <Image
        source={sprite.source}
        resizeMode="stretch"
        style={[
          { width: size * frames, height: dispH, transform: [{ translateX: -current * size }] },
          style,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  window: { overflow: 'hidden' },
});
