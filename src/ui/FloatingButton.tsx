import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';

import { theme } from './theme';

type Variant = 'primary' | 'default' | 'round';

/** Stepped hover offsets (px) — discrete frames give a pixel-game bob. */
const BOB = [0, -2, -4, -6, -4, -2] as const;
const BOB_FPS = 5;

interface Props {
  label?: string;
  onPress?: () => void;
  variant?: Variant;
  /** Stagger the hover so the dock buttons bob out of phase. */
  delay?: number;
  /** Size multiplier for the whole button (paddings, min width, font). */
  scale?: number;
}

/** A button that hovers above the ground in stepped pixel motion with a shadow. */
export function FloatingButton({ label, onPress, variant = 'default', delay = 0, scale = 1 }: Props) {
  const bob = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    let i = Math.round(delay / (1000 / BOB_FPS)) % BOB.length;
    const id = setInterval(() => {
      i = (i + 1) % BOB.length;
      bob.setValue(BOB[i]);
    }, 1000 / BOB_FPS);
    return () => clearInterval(id);
  }, [bob, delay]);

  const round = variant === 'round';
  const rectSize = { paddingHorizontal: 14 * scale, paddingVertical: 10 * scale, minWidth: 56 * scale };
  const roundSize = { width: 34 * scale, height: 34 * scale, borderRadius: 17 * scale };
  const textSize = round
    ? { fontSize: 18 * scale }
    : { fontSize: 8 * scale, lineHeight: 14 * scale, letterSpacing: scale };
  return (
    <Animated.View style={[styles.wrap, { transform: [{ translateY: bob }] }]}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.base,
          round ? [styles.round, roundSize] : [styles.rect, rectSize],
          variant === 'primary' && styles.primary,
          pressed && styles.pressed,
        ]}
      >
        <Text
          style={[
            round ? styles.gear : [styles.label, variant === 'primary' && styles.labelPrimary],
            textSize,
          ]}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    shadowColor: theme.colors.outline,
    shadowOpacity: 0.5,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.panel,
    borderWidth: theme.borderWidth,
    borderColor: theme.colors.outline,
    borderTopWidth: theme.borderWidth,
    borderTopColor: theme.colors.bevelLight,
    borderRadius: theme.borderRadius,
  },
  rect: {
    paddingHorizontal: theme.spacing(4),
    paddingVertical: theme.spacing(3),
    minWidth: 96,
  },
  round: { width: 52, height: 52, borderRadius: 26 },
  primary: { backgroundColor: theme.colors.gold },
  pressed: { opacity: 0.8 },
  label: {
    ...theme.type.label,
    color: theme.colors.text,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  labelPrimary: { color: theme.colors.bg },
  gear: { fontSize: 22, color: theme.colors.text },
});
