import React from 'react';
import { Animated, StyleSheet, useWindowDimensions, View } from 'react-native';
import { PixelArt } from './PixelArt';
import { MOON, SUN } from './sceneBitmaps';
import { DayPhase, PhaseVisual } from './timeOfDay';
import { useCycle } from './usePixelMotion';

/**
 * Sun / moon disc built from a pixel bitmap. The sun grows a stepped pixel
 * sunburst (orthogonal rays + diagonal pixel trails) that pulses in discrete
 * frames; the moon rises quietly without rays.
 */
const CELL = 6;
const DISC = 12 * CELL; // 72
const RADIUS = DISC / 2;
const RAY_LEN = 16;
const RAY_W = 8;
const SQ = 8;
const BOX = DISC + 2 * (RAY_LEN + SQ);
const C = BOX / 2;

/** Discrete pulse so the sunburst breathes in pixel steps, not a smooth ease. */
const PULSE = [1, 1.08, 1.14, 1.08, 1, 0.94] as const;

const ORB_TOP: Record<DayPhase, number> = {
  morning: 0.2,
  day: 0.08,
  evening: 0.16,
  night: 0.1,
};
const ORB_LEFT: Record<DayPhase, number> = {
  morning: 0.12,
  day: 0.68,
  evening: 0.7,
  night: 0.66,
};

function orthoRays(color: string) {
  const s = { position: 'absolute' as const, backgroundColor: color };
  return [
    { ...s, top: C - RADIUS - RAY_LEN, left: C - RAY_W / 2, width: RAY_W, height: RAY_LEN },
    { ...s, top: C + RADIUS, left: C - RAY_W / 2, width: RAY_W, height: RAY_LEN },
    { ...s, top: C - RAY_W / 2, left: C - RADIUS - RAY_LEN, width: RAY_LEN, height: RAY_W },
    { ...s, top: C - RAY_W / 2, left: C + RADIUS, width: RAY_LEN, height: RAY_W },
  ];
}

function diagRays(color: string) {
  const out: object[] = [];
  const s = { position: 'absolute' as const, backgroundColor: color, width: SQ, height: SQ };
  const near = RADIUS + 2;
  const far = RADIUS + 12;
  for (const dx of [-1, 1]) {
    for (const dy of [-1, 1]) {
      for (const d of [near, far]) {
        out.push({ ...s, top: C + dy * d * 0.7 - SQ / 2, left: C + dx * d * 0.7 - SQ / 2 });
      }
    }
  }
  return out;
}

export function SceneSun({ visual, phase }: { visual: PhaseVisual; phase: DayPhase }) {
  const { width } = useWindowDimensions();
  const scale = useCycle(PULSE, 4);
  const map = visual.moon
    ? { O: visual.orb, d: visual.orbShade, h: visual.orb }
    : { O: visual.orb, d: visual.orbShade, h: visual.ray };
  return (
    <View
      style={[styles.box, { top: `${ORB_TOP[phase] * 100}%`, left: width * ORB_LEFT[phase] - C }]}
      pointerEvents="none"
    >
      {!visual.moon && (
        <Animated.View style={[styles.rays, { transform: [{ scale }] }]}>
          {orthoRays(visual.ray).map((st, i) => (
            <View key={`o${i}`} style={st} />
          ))}
          {diagRays(visual.ray).map((st, i) => (
            <View key={`d${i}`} style={st} />
          ))}
        </Animated.View>
      )}
      <View style={styles.disc}>
        <PixelArt rows={visual.moon ? MOON : SUN} cell={CELL} map={map} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    position: 'absolute',
    width: BOX,
    height: BOX,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rays: { ...StyleSheet.absoluteFillObject },
  disc: { position: 'absolute', top: C - RADIUS, left: C - RADIUS },
});
