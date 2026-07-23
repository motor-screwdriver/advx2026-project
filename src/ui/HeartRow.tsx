import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ICONS } from '../../assets/manifest';
import { PixelSprite } from './PixelSprite';
import { theme } from './theme';

interface Props {
  hp: number;
  max?: number;
}

/** HP pips rendered from the real pixel heart icons: full vs empty. */
export function HeartRow({ hp, max = 7 }: Props) {
  return (
    <View style={styles.row}>
      {Array.from({ length: max }, (_, index) => (
        <PixelSprite
          key={index}
          sprite={index < hp ? ICONS.heart_full : ICONS.heart_empty}
          size={22}
        />
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
});
