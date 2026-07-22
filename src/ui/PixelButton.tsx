import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { theme } from './theme';

interface Props {
  label: string;
  onPress?: () => void;
  compact?: boolean;
  disabled?: boolean;
}

/**
 * Chunky inset button. Every interaction gets pixel feedback:
 * press-in scales to 0.95 and sinks 1px (sound hook lands with Dev C audio).
 */
export function PixelButton({ label, onPress, compact, disabled }: Props) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.button,
        compact && styles.compact,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Text style={[styles.label, compact && styles.labelCompact]}>{label}</Text>
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
  compact: {
    paddingVertical: theme.spacing(2),
    paddingHorizontal: theme.spacing(3),
  },
  pressed: {
    backgroundColor: theme.colors.panel,
    transform: [{ scale: 0.95 }, { translateY: 1 }],
  },
  disabled: {
    opacity: 0.4,
  },
  label: {
    ...theme.type.body,
    color: theme.colors.gold,
    letterSpacing: 1,
  },
  labelCompact: {
    ...theme.type.label,
    color: theme.colors.gold,
  },
});
