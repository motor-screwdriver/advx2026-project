import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { theme } from './theme';

interface Props {
  label: string;
  onPress?: () => void;
}

/** Chunky inset button in the pixel-panel language. Primary action styling. */
export function PixelButton({ label, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: theme.colors.inset,
    borderWidth: theme.borderWidth,
    borderColor: theme.colors.outline,
    borderTopColor: theme.colors.bevelLight,
    borderRadius: theme.borderRadius,
    paddingVertical: theme.spacing(3),
    paddingHorizontal: theme.spacing(4),
    alignItems: 'center',
  },
  pressed: {
    backgroundColor: theme.colors.panel,
    transform: [{ translateY: 1 }],
  },
  label: {
    ...theme.type.body,
    color: theme.colors.gold,
    letterSpacing: 1,
  },
});
