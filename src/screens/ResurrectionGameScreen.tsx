import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { SCENES } from '../../assets/manifest';
import { playSfx } from '../systems/audio';
import { PixelButton } from '../ui/PixelButton';
import { SceneBanner } from '../ui/SceneBanner';
import { Screen } from '../ui/Screen';
import { SoulTether } from '../ui/SoulTether';
import { strings } from '../ui/strings';
import { theme } from '../ui/theme';
import { useGame } from '../ui/useGame';

type Phase = 'playing' | 'won' | 'lost';

export function ResurrectionGameScreen() {
  const router = useRouter();
  const { resurrect, startNewHero } = useGame();
  const [phase, setPhase] = useState<Phase>('playing');

  const onResult = (success: boolean) => {
    setPhase(success ? 'won' : 'lost');
    if (success) {
      resurrect();
      playSfx('sfx_victory');
    }
  };

  const finish = () => {
    if (phase === 'won') {
      router.replace('/');
      return;
    }
    startNewHero();
    router.replace('/hero-ceremony');
  };

  return (
    <Screen title={strings.soul_title}>
      <SceneBanner sprite={SCENES.scene_resurrection} />
      {phase === 'playing' && <SoulTether onResult={onResult} />}
      {phase !== 'playing' && (
        <>
          <Text style={[styles.result, phase === 'lost' && styles.lost]}>
            {phase === 'won' ? strings.soul_success : strings.soul_fail}
          </Text>
          <PixelButton
            label={phase === 'won' ? strings.morning_continue : strings.death_new_hero}
            onPress={finish}
          />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  result: {
    ...theme.type.body,
    color: theme.colors.leaf,
    textAlign: 'center',
  },
  lost: {
    color: theme.colors.heartFull,
  },
});
