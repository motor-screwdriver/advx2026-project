/**
 * While the hero is tucked in he sets off on the night journey: he stays
 * centred and walks in place — the 6-frame side-profile walk strip carries the
 * gait (stride + body bob) while the ground scrolls beneath him. Returns a
 * `walking` flag so the caller can swap the strip and speed up the frames.
 */
export function useHeroWalk(asleep: boolean) {
  return { walking: asleep };
}
