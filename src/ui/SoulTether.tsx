import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { PixelButton } from './PixelButton';
import { ROUND_COUNT, ROUNDS_TO_WIN, isHit, roundZoneWidth, type GoldenZone } from './soulTetherLogic';
import { strings } from './strings';
import { theme } from './theme';

const OSCILLATION_MS = 850;

interface Props {
  isPaladin: boolean;
  onResult: (success: boolean) => void;
}

function makeZone(round: number, isPaladin: boolean): GoldenZone {
  const widthPct = roundZoneWidth(round, isPaladin);
  return { startPct: Math.random() * (100 - widthPct), widthPct };
}

/** Soul Tether: oscillating cursor, tap inside the golden zone. 3 rounds. */
export function SoulTether({ isPaladin, onResult }: Props) {
  const [round, setRound] = useState(0);
  const [hits, setHits] = useState(0);
  const [zone, setZone] = useState<GoldenZone>(() => makeZone(0, isPaladin));
  const [feedback, setFeedback] = useState<string | null>(null);
  const cursor = useRef(new Animated.Value(0)).current;
  const cursorPct = useRef(0);
  const oscillation = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    const id = cursor.addListener(({ value }) => {
      cursorPct.current = value;
    });
    return () => cursor.removeListener(id);
  }, [cursor]);

  // JS driver (not native): we must read the cursor position on tap.
  const startOscillation = useCallback(() => {
    cursor.setValue(0);
    oscillation.current = Animated.loop(
      Animated.sequence([
        Animated.timing(cursor, { toValue: 1, duration: OSCILLATION_MS, useNativeDriver: false }),
        Animated.timing(cursor, { toValue: 0, duration: OSCILLATION_MS, useNativeDriver: false }),
      ]),
    );
    oscillation.current.start();
  }, [cursor]);

  useEffect(() => {
    startOscillation();
    return () => oscillation.current?.stop();
  }, [startOscillation]);

  const tap = () => {
    oscillation.current?.stop();
    const hit = isHit(cursorPct.current * 100, zone);
    const newHits = hits + (hit ? 1 : 0);
    setHits(newHits);
    setFeedback(hit ? strings.soul_hit : strings.soul_miss);
    if (round >= ROUND_COUNT - 1) {
      onResult(newHits >= ROUNDS_TO_WIN);
      return;
    }
    const nextRound = round + 1;
    setRound(nextRound);
    setZone(makeZone(nextRound, isPaladin));
    setTimeout(startOscillation, 400);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.round}>
        {strings.soul_round} {round + 1}/{ROUND_COUNT}   {hits} hit
      </Text>
      <TetherBar cursor={cursor} zone={zone} />
      <Text style={styles.feedback}>{feedback ?? strings.soul_tap}</Text>
      <PixelButton label={strings.soul_tap} onPress={tap} />
    </View>
  );
}

function TetherBar({ cursor, zone }: { cursor: Animated.Value; zone: GoldenZone }) {
  return (
    <View style={styles.track}>
      <View style={[styles.zone, { left: `${zone.startPct}%`, width: `${zone.widthPct}%` }]} />
      <Animated.View
        style={[
          styles.cursor,
          { left: cursor.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: theme.spacing(4) },
  round: {
    ...theme.type.body,
    color: theme.colors.text,
    textAlign: 'center',
  },
  track: {
    height: 36,
    backgroundColor: theme.colors.inset,
    borderWidth: theme.borderWidth,
    borderColor: theme.colors.outline,
    borderRadius: theme.borderRadius,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  zone: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: theme.colors.gold,
    opacity: 0.85,
  },
  cursor: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 4,
    marginLeft: -2,
    backgroundColor: theme.colors.text,
  },
  feedback: {
    ...theme.type.body,
    color: theme.colors.gold,
    textAlign: 'center',
  },
});
