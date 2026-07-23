import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

/**
 * Pixel-art motion helpers. Instead of smooth interpolation these drive an
 * Animated.Value with discrete `setValue` steps on a low-frequency interval,
 * so every movement in the scene reads as chunky, stepped "pixel" motion.
 * Using setValue (not .start) keeps the React tree from re-rendering — only
 * the native transform node updates each tick.
 */

/**
 * Drifts a value from `from` to `to` in whole-pixel steps, then wraps back to
 * `from`. Used for clouds sliding across the sky.
 */
export function useDrift(from: number, to: number, stepPx: number, fps: number): Animated.Value {
  const v = useRef(new Animated.Value(from)).current;
  useEffect(() => {
    let x = from;
    const id = setInterval(() => {
      x += stepPx;
      if (x > to) {
        x = from;
      }
      v.setValue(Math.round(x));
    }, 1000 / fps);
    return () => clearInterval(id);
  }, [v, from, to, stepPx, fps]);
  return v;
}

/**
 * Steps an Animated.Value through a fixed list of values, looping. Used for
 * bobbing buttons, swaying grass and twinkling stars. Pass a module-level
 * constant array so its identity stays stable across renders.
 */
export function useCycle(values: readonly number[], fps: number): Animated.Value {
  const v = useRef(new Animated.Value(values[0] ?? 0)).current;
  const ref = useRef(values);
  ref.current = values;
  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      const list = ref.current;
      i = (i + 1) % list.length;
      v.setValue(list[i] ?? 0);
    }, 1000 / fps);
    return () => clearInterval(id);
  }, [v, fps]);
  return v;
}

/**
 * A looping scroll offset in whole-pixel steps, wrapping every `span` px. When
 * `enabled` is false the offset holds at 0. Pair it with a row of identical
 * tiles `span` wide to scroll a seamless, repeating ground beneath the hero.
 */
export function useScroll(enabled: boolean, span: number, stepPx: number, fps: number): Animated.Value {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!enabled) {
      v.setValue(0);
      return;
    }
    let x = 0;
    const id = setInterval(() => {
      x = (x + stepPx) % span;
      v.setValue(x);
    }, 1000 / fps);
    return () => clearInterval(id);
  }, [enabled, span, stepPx, fps, v]);
  return v;
}
