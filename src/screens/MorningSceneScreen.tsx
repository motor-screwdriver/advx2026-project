import { useRouter } from 'expo-router';
import React from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import type { NightOutcome } from '../contracts/types';
import { useFadeIn } from '../ui/animations';
import { HeroSprite } from '../ui/HeroSprite';
import { PixelButton } from '../ui/PixelButton';
import { PixelPanel } from '../ui/PixelPanel';
import { Screen } from '../ui/Screen';
import { strings } from '../ui/strings';
import { theme } from '../ui/theme';
import { useGame } from '../ui/useGame';

const OUTCOME_COLORS: Record<NightOutcome, string> = {
  PERFECT: theme.colors.pixelGold,
  GOOD: theme.colors.pixelGray,
  BAD: theme.colors.pixelGray,
  TERRIBLE: theme.colors.pixelBlack,
  MISSED: theme.colors.pixelGray,
};

const OUTCOME_KEYS: Record<NightOutcome, keyof typeof strings> = {
  PERFECT: 'outcome_perfect',
  GOOD: 'outcome_good',
  BAD: 'outcome_bad',
  TERRIBLE: 'outcome_terrible',
  MISSED: 'outcome_missed',
};

export function MorningSceneScreen() {
  const router = useRouter();
  const { state, lastEvaluation } = useGame();
  const fade = useFadeIn(300);

  if (!lastEvaluation) {
    return (
      <Screen title={strings.morning_title}>
        <Text style={styles.dim}>{strings.morning_missed}</Text>
        <PixelButton label={strings.morning_continue} onPress={() => router.back()} />
      </Screen>
    );
  }

  const color = OUTCOME_COLORS[lastEvaluation.outcome];
  const outcomeText = strings[OUTCOME_KEYS[lastEvaluation.outcome]];
  const { hpDelta, xp } = lastEvaluation;
  const resultText = `${hpDelta > 0 ? '+' : ''}${hpDelta} HP   +${xp} XP`;

  return (
    <Screen title={strings.morning_title}>
      <PixelPanel style={{ backgroundColor: color }}>
        <View style={styles.stage}>
          {state.hero && <HeroSprite type={state.hero.type} size={72} />}
          <Text style={[styles.outcome, { color }]}>{outcomeText}</Text>
        </View>
        <Animated.Text style={[styles.result, { opacity: fade }]}>{resultText}</Animated.Text>
      </PixelPanel>
      <PixelButton label={strings.morning_continue} onPress={() => router.replace('/')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  dim: {
    ...theme.type.body,
    color: theme.colors.textDim,
    textAlign: 'center',
  },
  stage: {
    alignItems: 'center',
    gap: theme.spacing(4),
  },
  outcome: {
    ...theme.type.title,
    fontSize: 24,
    textAlign: 'center',
  },
  result: {
    ...theme.type.body,
    color: theme.colors.text,
    textAlign: 'center',
  },
});
