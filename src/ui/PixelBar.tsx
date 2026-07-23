import React from 'react';
import { StyleSheet, View } from 'react-native';

import { theme } from './theme';

interface Props {
  value: number;
  max: number;
  color?: string;
}

/** Segmented pixel progress bar (e.g. the perfect-week streak). */
export function PixelBar({ value, max, color = theme.colors.leaf }: Props) {
  return (
    <View style={styles.bar}>
      {Array.from({ length: max }, (_, i) => (
        <View
          key={i}
          style={[styles.seg, { backgroundColor: i < value ? color : theme.colors.inset }]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    gap: 2,
    padding: 2,
    borderWidth: theme.borderWidth,
    borderColor: theme.colors.outline,
    borderRadius: 3,
    backgroundColor: theme.colors.inset,
  },
  seg: { width: 10, height: 12, borderRadius: 1 },
});
