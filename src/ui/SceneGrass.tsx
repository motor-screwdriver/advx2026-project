import React from 'react';
import { Animated, StyleSheet, useWindowDimensions, View } from 'react-native';
import { PixelArt } from './PixelArt';
import { FLOWER, TUFT } from './sceneBitmaps';
import { PhaseVisual } from './timeOfDay';
import { useCycle } from './usePixelMotion';

/**
 * Tall, detailed pixel-grass band with an irregular (non-straight) skyline of
 * blades, scattered texture specks, swaying tufts and a few flowers. Sits at
 * the bottom of the scene; the hero stands on top of it.
 */
export const GRASS_HEIGHT = 210;
const COL = 8;
const JAG = 26;
const SOIL = 34;
/** Irregular blade heights (px) — repeated across the width for a curvy top. */
const JAG_PATTERN = [8, 16, 11, 22, 14, 19, 9, 24, 13, 20, 10, 17] as const;
const SWAY = [0, 1, 2, 1, 0, -1, -2, -1] as const;
/** Blade group spacing and heights for the swaying grass field on the crest. */
const BLADE_GAP = 40;
const BLADE_H = [10, 18, 13, 20, 11, 16] as const;
const BLADE_FPS = [3, 4, 5] as const;

function Skyline({ width, main, tip }: { width: number; main: string; tip: string }) {
  const cols = Math.ceil(width / COL) + 1;
  return (
    <View style={styles.skyline}>
      {Array.from({ length: cols }, (_, i) => {
        const h = JAG_PATTERN[i % JAG_PATTERN.length];
        return (
          <View key={i} style={{ width: COL, height: h, backgroundColor: main }}>
            <View style={{ height: 3, backgroundColor: tip }} />
          </View>
        );
      })}
    </View>
  );
}

function Specks({ width, dark, bright }: { width: number; dark: string; bright: string }) {
  const dots = Math.floor(width / 18);
  return (
    <>
      {Array.from({ length: dots }, (_, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            top: JAG + 6 + (i % 5) * 14,
            left: (i * 37) % width,
            width: 4,
            height: 4,
            backgroundColor: i % 2 === 0 ? bright : dark,
          }}
        />
      ))}
    </>
  );
}

function SwayTuft({ left, bright, dark }: { left: number; bright: string; dark: string }) {
  const dx = useCycle(SWAY, 3);
  return (
    <Animated.View style={[styles.tuft, { left, transform: [{ translateX: dx }] }]}>
      <PixelArt rows={TUFT} cell={3} map={{ B: bright, D: dark }} />
    </Animated.View>
  );
}

/** A clump of thin blades that shear back and forth like grass in the wind. */
function BladeGroup({ left, fps, bright, main }: { left: number; fps: number; bright: string; main: string }) {
  const sway = useCycle(SWAY, fps);
  const skewX = sway.interpolate({ inputRange: [-2, 2], outputRange: ['-6deg', '6deg'] });
  const idx = Math.round(left / BLADE_GAP);
  return (
    <Animated.View style={[styles.blades, { left, transform: [{ skewX }] }]}>
      {[0, 1, 2, 3, 4].map((k) => (
        <View
          key={k}
          style={{
            width: 3,
            height: BLADE_H[(idx + k) % BLADE_H.length],
            marginRight: 2,
            backgroundColor: k % 2 === 0 ? bright : main,
          }}
        />
      ))}
    </Animated.View>
  );
}

export function SceneGrass({ visual }: { visual: PhaseVisual }) {
  const { width } = useWindowDimensions();
  const tufts = [0.06, 0.2, 0.42, 0.6, 0.78, 0.92];
  const flowers = [0.14, 0.5, 0.85];
  const bladeCount = Math.floor(width / BLADE_GAP) + 1;
  return (
    <View style={[styles.band, { height: GRASS_HEIGHT }]} pointerEvents="none">
      <Skyline width={width} main={visual.grass} tip={visual.grassBlade} />
      <View style={[styles.fill, { backgroundColor: visual.grass }]}>
        <Specks width={width} dark={visual.grassDark} bright={visual.grassBlade} />
        {flowers.map((f, i) => (
          <View key={`f${i}`} style={{ position: 'absolute', bottom: SOIL + 8, left: f * width }}>
            <PixelArt rows={FLOWER} cell={4} map={{ p: visual.flower, y: '#ffe9a8', g: visual.grassDark, D: visual.grassBlade }} />
          </View>
        ))}
      </View>
      <View style={[styles.soil, { height: SOIL, backgroundColor: visual.soil }]} />
      {Array.from({ length: bladeCount }, (_, i) => (
        <BladeGroup
          key={`b${i}`}
          left={i * BLADE_GAP + (i % 2) * 12}
          fps={BLADE_FPS[i % BLADE_FPS.length]}
          bright={visual.grassBlade}
          main={visual.grass}
        />
      ))}
      {tufts.map((t, i) => (
        <SwayTuft key={`t${i}`} left={t * width} bright={visual.grassBlade} dark={visual.grassDark} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  band: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  skyline: { flexDirection: 'row', alignItems: 'flex-end', height: JAG, overflow: 'hidden' },
  fill: { flex: 1 },
  soil: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  tuft: { position: 'absolute', bottom: SOIL + 2 },
  blades: {
    position: 'absolute',
    bottom: GRASS_HEIGHT - JAG,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
});
