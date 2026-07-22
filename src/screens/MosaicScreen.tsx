import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { PixelColor } from '../contracts/types';
import { PixelPanel } from '../ui/PixelPanel';
import { Screen } from '../ui/Screen';
import { strings } from '../ui/strings';
import { theme } from '../ui/theme';
import { useGame } from '../ui/useGame';

const DAYS_IN_YEAR = 365;

const PIXEL_COLORS: Record<PixelColor, string> = {
  GOLD: theme.colors.pixelGold,
  GRAY: theme.colors.pixelGray,
  BLACK: theme.colors.pixelBlack,
};

export function MosaicScreen() {
  const { state } = useGame();
  const perfectCount = state.nights.filter((night) => night.outcome === 'PERFECT').length;
  const perfectPct = state.nights.length
    ? Math.round((perfectCount / state.nights.length) * 100)
    : 0;

  return (
    <Screen title={strings.mosaic_title}>
      <PixelPanel>
        <View style={styles.stats}>
          <Stat label={strings.mosaic_level} value={String(state.hero?.level ?? 0)} />
          <Stat label={strings.mosaic_streak} value={String(state.perfectWeekStreak)} />
          <Stat label={strings.mosaic_perfect} value={`${perfectPct}%`} />
        </View>
      </PixelPanel>
      {state.nights.length === 0 ? (
        <Text style={styles.empty}>{strings.mosaic_empty}</Text>
      ) : (
        <View style={styles.grid}>
          {state.nights.map((night, index) => (
            <View
              key={`${night.date}-${index}`}
              style={[styles.pixel, { backgroundColor: PIXEL_COLORS[night.pixel] }]}
            />
          ))}
          {Array.from({ length: DAYS_IN_YEAR - state.nights.length }, (_, index) => (
            <View key={`empty-${index}`} style={[styles.pixel, styles.pixelEmpty]} />
          ))}
        </View>
      )}
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
    gap: theme.spacing(1),
  },
  statValue: {
    ...theme.type.title,
    color: theme.colors.gold,
  },
  statLabel: {
    ...theme.type.label,
    color: theme.colors.textDim,
    textTransform: 'uppercase',
  },
  empty: {
    ...theme.type.body,
    color: theme.colors.textDim,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  pixel: {
    width: 14,
    height: 14,
    borderRadius: 2,
  },
  pixelEmpty: {
    backgroundColor: theme.colors.inset,
  },
});
