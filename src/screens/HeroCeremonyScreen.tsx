import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { makePop, makeShake, useFadeIn } from '../ui/animations';
import { HeroSprite } from '../ui/HeroSprite';
import { PixelButton } from '../ui/PixelButton';
import { Screen } from '../ui/Screen';
import { strings } from '../ui/strings';
import { theme } from '../ui/theme';
import { useGame } from '../ui/useGame';

/** Dramatic summon: circle, scale-pop + screen shake, name + passive. */
export function HeroCeremonyScreen() {
  const router = useRouter();
  const { state } = useGame();
  const scale = useRef(new Animated.Value(0)).current;
  const shakeX = useRef(new Animated.Value(0)).current;
  const fade = useFadeIn(600);

  useEffect(() => {
    makePop(scale).start(() => makeShake(shakeX).start());
  }, [scale, shakeX]);

  const hero = state.hero;
  if (!hero) {
    return (
      <Screen title={strings.ceremony_summoning}>
        <View style={styles.filler} />
        <PixelButton label={strings.common_back} onPress={() => router.replace('/onboarding')} />
      </Screen>
    );
  }

  const heroName = strings[`hero_${hero.type}` as keyof typeof strings];

  return (
    <Screen title={strings.ceremony_summoning}>
      <View style={styles.stage}>
        <Animated.View style={[styles.circleOuter, { transform: [{ translateX: shakeX }] }]}>
          <View style={styles.circleInner}>
            <Animated.View style={{ transform: [{ scale }] }}>
              <HeroSprite type={hero.type} size={96} animated={false} />
            </Animated.View>
          </View>
        </Animated.View>
      </View>
      <Animated.View style={[styles.reveal, { opacity: fade }]}>
        <Text style={styles.name}>{heroName}</Text>
        <Text style={styles.awakens}>{strings.ceremony_awakens}</Text>
        <Text style={styles.passive}>{strings.ceremony_flavor}</Text>
        <PixelButton label={strings.ceremony_begin} onPress={() => router.replace('/')} />
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  filler: { flex: 1 },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleOuter: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: theme.borderWidth,
    borderColor: theme.colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleInner: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: theme.colors.inset,
    borderWidth: theme.borderWidth,
    borderColor: theme.colors.bevelLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reveal: { gap: theme.spacing(3) },
  name: {
    ...theme.type.title,
    fontSize: 22,
    color: theme.colors.gold,
    textAlign: 'center',
  },
  awakens: {
    ...theme.type.body,
    color: theme.colors.textDim,
    textAlign: 'center',
  },
  passive: {
    ...theme.type.body,
    color: theme.colors.leaf,
    textAlign: 'center',
  },
});
