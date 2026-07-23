import React from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import type { SpriteEntry } from '../../assets/manifest';
import { PixelSprite } from './PixelSprite';
import { theme } from './theme';

interface Props {
  sprite: SpriteEntry;
  animated?: boolean;
}

/** Full-width 16:9 pixel scene banner, framed like the panels. */
export function SceneBanner({ sprite, animated = true }: Props) {
  const { width } = useWindowDimensions();
  const inner = width - theme.spacing(4) * 2 - theme.borderWidth * 2;
  return (
    <View style={styles.frame}>
      <PixelSprite sprite={sprite} size={inner} animated={animated} fps={3} />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    alignSelf: 'center',
    backgroundColor: theme.colors.outline,
    borderRadius: theme.borderRadius + 2,
    padding: theme.borderWidth,
    overflow: 'hidden',
  },
});
