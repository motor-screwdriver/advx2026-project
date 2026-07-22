import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { FLAGS } from '../contracts/flags';
import { PixelPanel } from '../ui/PixelPanel';
import { Screen } from '../ui/Screen';
import { strings } from '../ui/strings';
import { theme } from '../ui/theme';

export function RaidLobbyScreen() {
  return (
    <Screen title={strings.raid_title}>
      <PixelPanel>
        <Text style={styles.body}>{FLAGS.raids ? strings.raid_body : strings.raid_disabled}</Text>
      </PixelPanel>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    ...theme.type.body,
    color: theme.colors.textDim,
    textAlign: 'center',
  },
});
