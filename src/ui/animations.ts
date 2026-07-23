import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

/**
 * Juicy-but-cheap animation helpers (visual bar: 2-4 frames, 60 fps,
 * no physics libs). Everything runs on the native driver.
 */

/** Looping up/down bob for idle sprites (2 frames feel). */
export function useBob(distance = 4, duration = 550): Animated.Value {
  const value = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(value, { toValue: -distance, duration, useNativeDriver: true }),
        Animated.timing(value, { toValue: 0, duration, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [value, distance, duration]);
  return value;
}

/** One-shot screen shake: quick left-right decay. Call .start() on the result. */
export function makeShake(value: Animated.Value, amplitude = 6): Animated.CompositeAnimation {
  const steps = [-1, 1, -0.6, 0.6, -0.3, 0.3, 0];
  return Animated.sequence(
    steps.map((factor) =>
      Animated.timing(value, {
        toValue: factor * amplitude,
        duration: 40,
        useNativeDriver: true,
      }),
    ),
  );
}

/** Spring scale-pop for reveals (hero summon, loot card). */
export function makePop(value: Animated.Value): Animated.CompositeAnimation {
  return Animated.spring(value, {
    toValue: 1,
    friction: 4,
    tension: 90,
    useNativeDriver: true,
  });
}

/** Fade-in on mount with optional delay. */
export function useFadeIn(delay = 0, duration = 300): Animated.Value {
  const value = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const animation = Animated.timing(value, {
      toValue: 1,
      duration,
      delay,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [value, delay, duration]);
  return value;
}
