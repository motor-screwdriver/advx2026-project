import React from 'react';
import { Animated, StyleSheet, useWindowDimensions } from 'react-native';
import { PixelArt } from './PixelArt';
import { CLOUD_BIG, CLOUD_SMALL, CLOUD_WISP } from './sceneBitmaps';
import { PhaseVisual } from './timeOfDay';
import { useDrift } from './usePixelMotion';

/**
 * Blocky pixel clouds that drift across the sky in stepped whole-pixel jumps.
 * Each cloud has its own bitmap, cell size, height and speed so the parallax
 * feels layered rather than uniform.
 */
interface CloudDef {
  rows: readonly string[];
  cell: number;
  top: number;
  stepPx: number;
  fps: number;
}

const CLOUDS: readonly CloudDef[] = [
  { rows: CLOUD_BIG, cell: 7, top: 0.14, stepPx: 1, fps: 6 },
  { rows: CLOUD_SMALL, cell: 6, top: 0.26, stepPx: 1, fps: 4 },
  { rows: CLOUD_WISP, cell: 5, top: 0.08, stepPx: 2, fps: 5 },
  { rows: CLOUD_SMALL, cell: 4, top: 0.36, stepPx: 1, fps: 3 },
];

function Cloud({ def, tint, shade }: { def: CloudDef; tint: string; shade: string }) {
  const { width, height } = useWindowDimensions();
  const cloudW = def.rows[0].length * def.cell;
  const x = useDrift(-cloudW, width + 20, def.stepPx, def.fps);
  return (
    <Animated.View
      style={[styles.cloud, { top: height * def.top, transform: [{ translateX: x }] }]}
    >
      <PixelArt rows={def.rows} cell={def.cell} map={{ W: tint, s: shade }} />
    </Animated.View>
  );
}

export function SceneClouds({ visual }: { visual: PhaseVisual }) {
  return (
    <>
      {CLOUDS.map((def, i) => (
        <Cloud key={i} def={def} tint={visual.cloud} shade={visual.cloudShade} />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  cloud: { position: 'absolute', left: 0 },
});
