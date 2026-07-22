import { Link, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { HeartRow } from '../ui/HeartRow';
import { HeroSprite } from '../ui/HeroSprite';
import { PixelButton } from '../ui/PixelButton';
import { PixelPanel } from '../ui/PixelPanel';
import { Screen } from '../ui/Screen';
import { strings } from '../ui/strings';
import { theme } from '../ui/theme';
import { useGame } from '../ui/useGame';
import { DebugMenu } from './DebugMenu';

const MAX_HP = 7;

export function HomeScreen() {
  const { state } = useGame();
  if (!state.hero) {
    return <NoHeroHome />;
  }
  return <HeroHome />;
}

function NoHeroHome() {
  const router = useRouter();
  return (
    <Screen title={strings.home_title}>
      <Text style={styles.empty}>{strings.home_no_hero}</Text>
      <PixelButton label={strings.onboarding_begin} onPress={() => router.replace('/onboarding')} />
    </Screen>
  );
}

function HeroHome() {
  const router = useRouter();
  const { state, pendingBedTime, sleepNow, wakeNow } = useGame();
  const hero = state.hero!;

  const onContextTap = () => {
    if (pendingBedTime === null) {
      sleepNow();
      return;
    }
    const evaluation = wakeNow();
    const hpAfter = Math.min(Math.max(state.hp + evaluation.hpDelta, 0), MAX_HP);
    router.push(hpAfter === 0 ? '/death' : '/morning-scene');
  };

  return (
    <Screen title={strings.home_title}>
      <PixelPanel>
        <View style={styles.heroRow}>
          <HeroSprite type={hero.type} size={72} />
          <View style={styles.heroMeta}>
            <Text style={styles.heroName}>
              {strings[`hero_${hero.type}` as keyof typeof strings]}
            </Text>
            <Text style={styles.level}>
              {strings.home_level} {hero.level}
            </Text>
          </View>
        </View>
        <HeartRow hp={state.hp} />
        <Text style={styles.streak}>
          {strings.home_streak}: {state.perfectWeekStreak}/{MAX_HP}
        </Text>
      </PixelPanel>
      <PixelButton
        label={pendingBedTime === null ? strings.home_sleep : strings.home_wakeup}
        onPress={onContextTap}
      />
      <View style={styles.navRow}>
        <Link href="/mosaic" asChild>
          <PixelButton compact label="MOS" />
        </Link>
        <Link href="/inventory" asChild>
          <PixelButton compact label="INV" />
        </Link>
        <Link href="/settings" asChild>
          <PixelButton compact label="SET" />
        </Link>
      </View>
      <DebugMenu />
    </Screen>
  );
}

const styles = StyleSheet.create({
  empty: {
    ...theme.type.body,
    color: theme.colors.textDim,
    textAlign: 'center',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing(4),
  },
  heroMeta: { gap: theme.spacing(2) },
  heroName: {
    ...theme.type.title,
    color: theme.colors.text,
  },
  level: {
    ...theme.type.body,
    color: theme.colors.gold,
  },
  streak: {
    ...theme.type.body,
    color: theme.colors.leaf,
    textAlign: 'center',
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing(3),
  },
});
