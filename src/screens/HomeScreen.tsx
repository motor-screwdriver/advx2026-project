import { Link, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { playMusic } from '../systems/audio';
import { HeartRow } from '../ui/HeartRow';
import { HeroSprite } from '../ui/HeroSprite';
import { PixelButton } from '../ui/PixelButton';
import { PixelPanel } from '../ui/PixelPanel';
import { Screen } from '../ui/Screen';
import { strings } from '../ui/strings';
import { theme } from '../ui/theme';
import { useGame } from '../ui/useGame';
import { formatClock } from '../ui/window';
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

  // Cozy day theme while awake; hushed night theme once tucked in.
  useEffect(() => {
    playMusic(pendingBedTime === null ? 'music_day' : 'music_night');
  }, [pendingBedTime]);

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
      <HeroPanel />
      <PixelButton
        label={pendingBedTime === null ? strings.home_sleep : strings.home_wakeup}
        onPress={onContextTap}
      />
      {pendingBedTime !== null && <Text style={styles.hint}>{strings.home_sleeping_hint}</Text>}
      <View style={styles.navRow}>
        <Link href="/mosaic" asChild>
          <PixelButton compact label={strings.home_nav_mosaic} />
        </Link>
        <Link href="/inventory" asChild>
          <PixelButton compact label={strings.home_nav_bag} />
        </Link>
        <Link href="/heroes" asChild>
          <PixelButton compact label={strings.home_nav_heroes} />
        </Link>
        <Link href="/settings" asChild>
          <PixelButton compact label={strings.home_nav_settings} />
        </Link>
      </View>
      <DebugMenu />
    </Screen>
  );
}

function HeroPanel() {
  const { state } = useGame();
  const hero = state.hero!;
  return (
    <PixelPanel>
      <View style={styles.heroRow}>
        <HeroSprite type={hero.type} size={72} gold={state.perfectWeekStreak >= MAX_HP} />
        <View style={styles.heroMeta}>
          <Text style={styles.heroName}>{strings[`hero_${hero.type}` as keyof typeof strings]}</Text>
          <Text style={styles.level}>
            {strings.home_level} {hero.level}
          </Text>
          {state.window && (
            <Text style={styles.window}>
              {strings.home_window}: {formatClock(state.window.bedMin)} -{' '}
              {formatClock(state.window.wakeMin)}
            </Text>
          )}
        </View>
      </View>
      <Text style={styles.caption}>{strings.home_hearts}</Text>
      <HeartRow hp={state.hp} />
      <Text style={styles.streak}>
        {strings.home_streak}: {state.perfectWeekStreak}/{MAX_HP}
      </Text>
    </PixelPanel>
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
  window: {
    ...theme.type.label,
    color: theme.colors.textDim,
  },
  caption: {
    ...theme.type.label,
    color: theme.colors.textDim,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  hint: {
    ...theme.type.label,
    color: theme.colors.gold,
    textAlign: 'center',
  },
  streak: {
    ...theme.type.body,
    color: theme.colors.leaf,
    textAlign: 'center',
  },
  navRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: theme.spacing(3),
  },
});
