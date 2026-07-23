import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PixelButton } from '../ui/PixelButton';
import { PixelPanel } from '../ui/PixelPanel';
import { Screen } from '../ui/Screen';
import { strings } from '../ui/strings';
import { theme } from '../ui/theme';

// 5x5 pixel icons drawn from views, matching the game's chunky look.
const MOON = ['.XX..', 'XX...', 'X....', 'XX...', '.XX..'];
const SUN = ['..X..', '.XXX.', 'XXXXX', '.XXX.', '..X..'];
const CHEST = ['XXXXX', 'X.X.X', 'XXXXX', 'X...X', 'XXXXX'];

const RULES = [
  {
    icon: MOON,
    tint: theme.colors.gold,
    title: strings.tutorial_card1_title,
    body: strings.tutorial_card1_body,
  },
  {
    icon: SUN,
    tint: theme.colors.leaf,
    title: strings.tutorial_card2_title,
    body: strings.tutorial_card2_body,
  },
  {
    icon: CHEST,
    tint: theme.colors.gold,
    title: strings.tutorial_card3_title,
    body: strings.tutorial_card3_body,
  },
] as const;

/** Three rules, all visible at once — no swipe hunting. */
export function TutorialScreen() {
  const router = useRouter();
  return (
    <Screen title={strings.tutorial_title}>
      {RULES.map((rule) => (
        <PixelPanel key={rule.title} contentStyle={styles.card}>
          <PixelIcon pattern={rule.icon} tint={rule.tint} />
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>{rule.title}</Text>
            <Text style={styles.cardBody}>{rule.body}</Text>
          </View>
        </PixelPanel>
      ))}
      <View style={styles.footer}>
        <PixelButton label={strings.tutorial_done} onPress={() => router.dismissTo('/')} />
      </View>
    </Screen>
  );
}

function PixelIcon({ pattern, tint }: { pattern: readonly string[]; tint: string }) {
  return (
    <View style={styles.icon}>
      {pattern.map((row, y) => (
        <View key={y} style={styles.iconRow}>
          {row.split('').map((cell, x) => (
            <View key={x} style={[styles.cell, cell === 'X' && { backgroundColor: tint }]} />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing(4),
  },
  cardText: {
    flex: 1,
    gap: theme.spacing(2),
  },
  cardTitle: {
    ...theme.type.body,
    color: theme.colors.gold,
  },
  cardBody: {
    ...theme.type.label,
    color: theme.colors.textDim,
    textTransform: 'none',
  },
  footer: { marginTop: 'auto' },
  icon: {
    padding: theme.spacing(2),
    backgroundColor: theme.colors.inset,
    borderWidth: theme.borderWidth,
    borderColor: theme.colors.outline,
    borderRadius: theme.borderRadius,
  },
  iconRow: { flexDirection: 'row' },
  cell: { width: 8, height: 8 },
});
