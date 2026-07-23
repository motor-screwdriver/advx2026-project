import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  ROUND_COUNT,
  ROUNDS_TO_WIN,
  isHit,
  roundZoneWidth,
  type GoldenZone,
} from './soulTetherLogic';
import { strings } from './strings';
import { theme } from './theme';

/**
 * Cursor speed per round (ms per half-sweep). Round 1 is forgiving so the
 * player learns the timing; later rounds stay tense. Speed is the difficulty
 * knob together with the shrinking zone — too fast feels broken, not hard,
 * because touch latency alone eats ~20% of the bar.
 */
const ROUND_MS = [1400, 1200, 1000] as const;

interface Props {
  onResult: (success: boolean) => void;
}

function makeZone(round: number): GoldenZone {
  const widthPct = roundZoneWidth(round);
  return { startPct: Math.random() * (100 - widthPct), widthPct };
}

/** Soul Tether: oscillating cursor, tap ANYWHERE inside the golden zone. */
export function SoulTether({ onResult }: Props) {
  const [round, setRound] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const [zone, setZone] = useState<GoldenZone>(() => makeZone(0));
  const [feedback, setFeedback] = useState<string | null>(null);
  const tether = useTetherCursor();

  const tap = () => {
    if (!tether.armed.current) {
      return;
    }
    tether.armed.current = false;
    tether.oscillation.current?.stop();
    const hit = isHit(tether.cursorPct.current * 100, zone);
    const nextResults = [...results, hit];
    setResults(nextResults);
    setFeedback(hit ? strings.soul_hit : strings.soul_miss);
    if (round >= ROUND_COUNT - 1) {
      const hits = nextResults.filter(Boolean).length;
      onResult(hits >= ROUNDS_TO_WIN);
      return;
    }
    const nextRound = round + 1;
    setRound(nextRound);
    setZone(makeZone(nextRound));
    setTimeout(() => tether.startOscillation(ROUND_MS[nextRound]), 400);
  };

  return (
    // onPressIn: the hit must register at touch-down, not finger-lift,
    // otherwise the cursor visibly leaves the zone before the tap lands.
    <Pressable style={styles.container} onPressIn={tap}>
      <Text style={styles.instruction}>{strings.soul_instruction}</Text>
      <Text style={styles.goal}>{strings.soul_goal}</Text>
      <View style={styles.statusRow}>
        <Text style={styles.round}>
          {strings.soul_round} {round + 1}/{ROUND_COUNT}
        </Text>
        <RoundPips results={results} total={ROUND_COUNT} />
      </View>
      <TetherBar cursor={tether.cursor} zone={zone} />
      <Text style={[styles.feedback, feedback === strings.soul_miss && styles.miss]}>
        {feedback ?? strings.soul_tap}
      </Text>
    </Pressable>
  );
}

/** Cursor oscillation machinery, kept apart to stay under the line budget. */
function useTetherCursor() {
  const cursor = useRef(new Animated.Value(0)).current;
  const cursorPct = useRef(0);
  const oscillation = useRef<Animated.CompositeAnimation | null>(null);
  const armed = useRef(true); // ignore taps while the cursor is paused

  useEffect(() => {
    const id = cursor.addListener(({ value }) => {
      cursorPct.current = value;
    });
    return () => cursor.removeListener(id);
  }, [cursor]);

  // JS driver (not native): we must read the cursor position on tap.
  const startOscillation = useCallback(
    (halfSweepMs: number) => {
      cursor.setValue(0);
      armed.current = true;
      const timing = (toValue: number) =>
        Animated.timing(cursor, { toValue, duration: halfSweepMs, useNativeDriver: false });
      oscillation.current = Animated.loop(Animated.sequence([timing(1), timing(0)]));
      oscillation.current.start();
    },
    [cursor],
  );

  useEffect(() => {
    startOscillation(ROUND_MS[0]);
    return () => oscillation.current?.stop();
  }, [startOscillation]);

  return { cursor, cursorPct, oscillation, armed, startOscillation };
}

function RoundPips({ results, total }: { results: boolean[]; total: number }) {
  return (
    <View style={styles.pips}>
      {Array.from({ length: total }, (_, index) => (
        <View
          key={index}
          style={[
            styles.pip,
            index < results.length && (results[index] ? styles.pipHit : styles.pipMiss),
          ]}
        />
      ))}
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
  container: {
    flex: 1,
    justifyContent: 'center',
    gap: theme.spacing(4),
  },
  instruction: {
    ...theme.type.body,
    color: theme.colors.text,
    textAlign: 'center',
  },
  goal: {
    ...theme.type.label,
    color: theme.colors.textDim,
    textAlign: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing(4),
  },
  round: {
    ...theme.type.body,
    color: theme.colors.text,
  },
  pips: {
    flexDirection: 'row',
    gap: theme.spacing(2),
  },
  pip: {
    width: 14,
    height: 14,
    backgroundColor: theme.colors.inset,
    borderWidth: theme.borderWidth,
    borderColor: theme.colors.outline,
    borderRadius: 2,
  },
  pipHit: { backgroundColor: theme.colors.gold },
  pipMiss: { backgroundColor: theme.colors.heartFull },
  track: {
    height: 48,
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
  miss: { color: theme.colors.heartFull },
});
