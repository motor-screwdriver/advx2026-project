import { useEffect, useRef, useState } from 'react';
import { Animated, useWindowDimensions } from 'react-native';

/** Steps of the walk-off tween when the hero departs on the night journey. */
const WALK_STEPS = 14;
const WALK_FPS = 12;

/**
 * Drives the hero's departure on the home scene: when tucked in he walks
 * up-and-away toward the hills (smaller = further off) in stepped pixel
 * motion, then walks back on wake. Returns the animated transform plus a
 * `walking` flag so the caller can speed up the sprite's gait.
 */
export function useHeroWalk(asleep: boolean) {
  const { width } = useWindowDimensions();
  const x = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const pose = useRef({ x: 0, y: 0, s: 1 });
  const [walking, setWalking] = useState(false);

  useEffect(() => {
    const to = asleep ? { x: Math.round(width * 0.32), y: -52, s: 0.62 } : { x: 0, y: 0, s: 1 };
    const from = { ...pose.current };
    if (from.x === to.x && from.y === to.y && from.s === to.s) {
      return;
    }
    setWalking(true);
    let k = 0;
    const id = setInterval(() => {
      k += 1;
      const p = k / WALK_STEPS;
      const next = {
        x: Math.round(from.x + (to.x - from.x) * p),
        y: Math.round(from.y + (to.y - from.y) * p),
        s: from.s + (to.s - from.s) * p,
      };
      x.setValue(next.x);
      y.setValue(next.y);
      scale.setValue(next.s);
      pose.current = next;
      if (k >= WALK_STEPS) {
        clearInterval(id);
        setWalking(false);
      }
    }, 1000 / WALK_FPS);
    return () => clearInterval(id);
  }, [asleep, width, x, y, scale]);

  return { walking, transform: [{ translateX: x }, { translateY: y }, { scale }] };
}
