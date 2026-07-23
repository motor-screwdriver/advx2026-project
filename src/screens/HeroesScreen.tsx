import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import type { HeroType } from '../contracts/types';
import { HeroSprite } from '../ui/HeroSprite';
import { PixelPanel } from '../ui/PixelPanel';
import { Screen } from '../ui/Screen';
import { strings } from '../ui/strings';
import { theme } from '../ui/theme';
import { useGame } from '../ui/useGame';

interface RowSpec {
  label: string;
  heroes: { type: HeroType; condition: string }[];
}

/** Mirrors the 3×3 summoning grid (engine/hero.ts), bedtime rows × duration. */
const ROWS: RowSpec[] = [
  {
    label: strings.heroes_early,
    heroes: [
      { type: 'monk', condition: strings.heroes_dur_short },
      { type: 'ranger', condition: strings.heroes_dur_mid },
      { type: 'druid', condition: strings.heroes_dur_long },
    ],
  },
  {
    label: strings.heroes_normal,
    heroes: [
      { type: 'rogue', condition: strings.heroes_dur_short },
      { type: 'knight', condition: strings.heroes_dur_mid },
      { type: 'paladin', condition: strings.heroes_dur_long },
    ],
  },
  {
    label: strings.heroes_late,
    heroes: [
      { type: 'ninja', condition: strings.heroes_dur_short },
      { type: 'mage', condition: strings.heroes_dur_mid },
      { type: 'warlock', condition: strings.heroes_dur_long },
    ],
  },
];

export function HeroesScreen() {
  const { state } = useGame();
  const current = state.hero?.type ?? null;
  return (
    <Screen title={strings.heroes_title}>
      <Text style={styles.intro}>{strings.heroes_intro}</Text>
      <ScrollView contentContainerStyle={styles.scroll}>
        {ROWS.map((row) => (
          <View key={row.label} style={styles.section}>
            <Text style={styles.sectionLabel}>{row.label}</Text>
            <View style={styles.row}>
              {row.heroes.map((hero) => (
                <HeroCard
                  key={hero.type}
                  type={hero.type}
                  condition={hero.condition}
                  isCurrent={hero.type === current}
                />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

interface CardProps {
  type: HeroType;
  condition: string;
  isCurrent: boolean;
}

function HeroCard({ type, condition, isCurrent }: CardProps) {
  return (
    <PixelPanel
      style={[styles.card, isCurrent && styles.cardCurrent]}
      contentStyle={styles.cardContent}
    >
      <HeroSprite type={type} size={48} animated={false} />
      <Text style={styles.cardName}>{strings[`hero_${type}` as keyof typeof strings]}</Text>
      <Text style={styles.cardCondition}>{condition}</Text>
      {isCurrent && <Text style={styles.currentTag}>{strings.heroes_current}</Text>}
    </PixelPanel>
  );
}

const styles = StyleSheet.create({
  intro: {
    ...theme.type.label,
    color: theme.colors.textDim,
    textAlign: 'center',
  },
  scroll: { gap: theme.spacing(4), paddingBottom: theme.spacing(6) },
  section: { gap: theme.spacing(2) },
  sectionLabel: {
    ...theme.type.label,
    color: theme.colors.text,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing(2),
  },
  card: {
    flex: 1,
  },
  cardContent: {
    flexGrow: 1,
    alignItems: 'center',
    gap: theme.spacing(2),
  },
  cardCurrent: {
    borderColor: theme.colors.gold,
  },
  cardName: {
    ...theme.type.label,
    color: theme.colors.text,
  },
  cardCondition: {
    ...theme.type.label,
    color: theme.colors.textDim,
    textAlign: 'center',
  },
  currentTag: {
    ...theme.type.label,
    color: theme.colors.gold,
    textTransform: 'uppercase',
  },
});
