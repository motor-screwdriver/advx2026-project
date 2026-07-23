import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { theme } from './theme';

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** Chunky pixel panel: dark 2px frame + brass top bevel. The base surface. */
export function PixelPanel({ children, style }: Props) {
  return (
    <View style={[styles.frame, style]}>
      <View style={styles.panel}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    backgroundColor: theme.colors.outline,
    borderRadius: theme.borderRadius + 2,
    padding: theme.borderWidth,
  },
  panel: {
    backgroundColor: theme.colors.panel,
    borderRadius: theme.borderRadius,
    borderTopWidth: theme.borderWidth,
    borderTopColor: theme.colors.bevelLight,
    paddingHorizontal: theme.spacing(4),
    paddingVertical: theme.spacing(5),
    gap: theme.spacing(4),
  },
});
