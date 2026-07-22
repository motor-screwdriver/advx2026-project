import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import type { HeroType } from '../contracts/types';
import { useBob } from './animations';
import { HERO_BITMAP, HERO_COLORS, SKIN_COLOR } from './heroSprites';
import { theme } from './theme';

interface Props {
  type: HeroType;
  size?: number;
  animated?: boolean;
}

/** Pixel hero rendered from a bitmap (placeholder until real sprites). */
export function HeroSprite({ type, size = 64, animated = true }: Props) {
  const bob = useBob();
  const cell = size / 8;
  return (
    <Animated.View style={animated ? { transform: [{ translateY: bob }] } : undefined}>
      {HERO_BITMAP.map((row, y) => (
        <View key={y} style={styles.row}>
          {row.split('').map((char, x) => (
            <View
              key={x}
              style={{ width: cell, height: cell, backgroundColor: pixelColor(char, type) }}
            />
          ))}
        </View>
      ))}
    </Animated.View>
  );
}

function pixelColor(char: string, type: HeroType): string {
  switch (char) {
    case 'O':
    case 'E':
      return theme.colors.outline;
    case 'C':
      return HERO_COLORS[type];
    case 'S':
      return SKIN_COLOR;
    default:
      return 'transparent';
  }
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
});
