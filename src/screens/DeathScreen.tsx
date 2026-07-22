import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { HeroSprite } from '../ui/HeroSprite';
import { PixelButton } from '../ui/PixelButton';
import { PixelPanel } from '../ui/PixelPanel';
import { Screen } from '../ui/Screen';
import { strings } from '../ui/strings';
import { theme } from '../ui/theme';
import { useGame } from '../ui/useGame';

export function DeathScreen() {
  const router = useRouter();
  const { state, canResurrect, startNewHero } = useGame();
  const hero = state.hero;

  if (!hero) {
    return (
      <Screen title={strings.death_title}>
        <PixelButton label={strings.common_back} onPress={() => router.replace('/')} />
      </Screen>
    );
  }

  const newHero = () => {
    startNewHero();
    router.replace('/hero-ceremony');
  };

  return (
    <Screen title={strings.death_title}>
      <PixelPanel>
        <View style={styles.stage}>
          <View style={styles.fallen}>
            <HeroSprite type={hero.type} size={64} animated={false} />
          </View>
          <Text style={styles.body}>{strings.death_body}</Text>
        </View>
      </PixelPanel>
      {canResurrect() ? (
        <PixelButton label={strings.death_resurrect_cta} onPress={() => router.push('/resurrection')} />
      ) : (
        <View style={styles.goneBlock}>
          <Text style={styles.dim}>{strings.death_no_charge}</Text>
          <Text style={styles.gone}>{strings.death_gone}</Text>
          <PixelButton label={strings.death_new_hero} onPress={newHero} />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  stage: {
    alignItems: 'center',
    gap: theme.spacing(4),
  },
  fallen: {
    opacity: 0.45,
    transform: [{ rotate: '90deg' }],
  },
  body: {
    ...theme.type.body,
    color: theme.colors.textDim,
    textAlign: 'center',
  },
  goneBlock: { gap: theme.spacing(3) },
  dim: {
    ...theme.type.label,
    color: theme.colors.textDim,
    textAlign: 'center',
  },
  gone: {
    ...theme.type.body,
    color: theme.colors.heartFull,
    textAlign: 'center',
  },
});
