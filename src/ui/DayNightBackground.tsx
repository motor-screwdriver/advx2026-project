import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Animated, StyleSheet, useWindowDimensions, View } from 'react-native';

import { SceneClouds } from './SceneClouds';
import { GRASS_HEIGHT, SceneGrass } from './SceneGrass';
import { SceneSun } from './SceneSun';
import { PHASE_VISUALS, type DayPhase } from './timeOfDay';
import { useCycle } from './usePixelMotion';

const HCOL = 10;
/** Pseudo-random star field (x,y fractions of the sky), split into 3 blink groups. */
const STARS: readonly [number, number][] = [
  [0.08, 0.06], [0.19, 0.12], [0.27, 0.04], [0.36, 0.15], [0.44, 0.08],
  [0.52, 0.03], [0.61, 0.13], [0.68, 0.07], [0.76, 0.16], [0.83, 0.05],
  [0.91, 0.11], [0.13, 0.2], [0.31, 0.23], [0.49, 0.19], [0.66, 0.25],
  [0.79, 0.21], [0.88, 0.28], [0.05, 0.3], [0.24, 0.32], [0.57, 0.31], [0.72, 0.34],
];
const TWINKLE = [1, 0.85, 0.5, 0.85] as const;

function Hills(props: { color: string; base: number; amp: number; waves: number; phase: number; bottom: number }) {
  const { width } = useWindowDimensions();
  const cols = Math.ceil(width / HCOL) + 1;
  return (
    <View style={[styles.hills, { bottom: props.bottom }]} pointerEvents="none">
      {Array.from({ length: cols }, (_, i) => {
        const t = (i / cols) * Math.PI * props.waves + props.phase;
        const h = Math.round(props.base + props.amp * Math.sin(t));
        return <View key={i} style={{ width: HCOL, height: h, backgroundColor: props.color }} />;
      })}
    </View>
  );
}

function Stars({ color }: { color: string }) {
  const { width, height } = useWindowDimensions();
  const cycles = [useCycle(TWINKLE, 3), useCycle(TWINKLE, 2), useCycle(TWINKLE, 4)];
  return (
    <>
      {STARS.map(([x, y], i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            top: height * y,
            left: width * x,
            width: i % 4 === 0 ? 4 : 3,
            height: i % 4 === 0 ? 4 : 3,
            backgroundColor: color,
            opacity: cycles[i % 3],
          }}
        />
      ))}
    </>
  );
}

/** Full-bleed animated pixel sky/ground scene behind the home overlays. When
 * `traveling` the ground scrolls beneath the (centred) walking hero. */
export function DayNightBackground({ phase, traveling = false }: { phase: DayPhase; traveling?: boolean }) {
  const v = PHASE_VISUALS[phase];
  return (
    <View style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={v.sky as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {v.stars && <Stars color={v.orb} />}
      <SceneSun visual={v} phase={phase} />
      <SceneClouds visual={v} />
      <Hills color={v.hillBack} base={40} amp={24} waves={2.2} phase={0} bottom={GRASS_HEIGHT - 12} />
      <Hills color={v.hillFront} base={28} amp={30} waves={3.1} phase={1.4} bottom={GRASS_HEIGHT - 4} />
      <SceneGrass visual={v} traveling={traveling} />
    </View>
  );
}

const styles = StyleSheet.create({
  hills: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 90,
    overflow: 'hidden',
  },
});
