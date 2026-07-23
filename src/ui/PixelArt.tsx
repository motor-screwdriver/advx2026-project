import React, { useMemo } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';

/**
 * Renders a tiny bitmap (an array of equal-length strings) as chunky pixels.
 * Each character maps to a fill colour via `map`; characters missing from the
 * map (including spaces) render transparent. This is the core primitive for
 * the hand-drawn pixel clouds, sun, grass tufts and flowers — no anti-aliased
 * curves, just square cells.
 */
interface Props {
  rows: readonly string[];
  cell: number;
  map: Record<string, string>;
  style?: StyleProp<ViewStyle>;
}

export function PixelArt({ rows, cell, map, style }: Props) {
  const pixels = useMemo(() => rows.map((r) => r.split('')), [rows]);
  return (
    <View style={style}>
      {pixels.map((row, y) => (
        <View key={y} style={{ flexDirection: 'row' }}>
          {row.map((ch, x) => (
            <View
              key={x}
              style={{ width: cell, height: cell, backgroundColor: map[ch] }}
            />
          ))}
        </View>
      ))}
    </View>
  );
}
