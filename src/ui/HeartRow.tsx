import React from 'react';
import { StyleSheet, View } from 'react-native';

import { theme } from './theme';

interface Props {
  hp: number;
  max?: number;
}

/** HP pips: one square per heart, beveled when full. Static for now (stub). */
export function HeartRow({ hp, max = 7 }: Props) {
  return (
    <View style={styles.row}>
      {Array.from({ length: max }, (_, index) => (
        <View key={index} style={[styles.pip, index < hp ? styles.full : styles.empty]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing(2),
  },
  pip: {
    width: 20,
    height: 20,
    borderWidth: theme.borderWidth,
    borderColor: theme.colors.outline,
    borderRadius: 2,
  },
  full: {
    backgroundColor: theme.colors.heartFull,
    borderTopColor: theme.colors.heartFullEdge,
  },
  empty: {
    backgroundColor: theme.colors.heartEmpty,
  },
});
