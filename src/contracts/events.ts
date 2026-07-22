/**
 * Game event contract (M0, frozen). Events describe things that happened
 * in the engine; UI/systems (cut-scenes, notifications, e-ink) react to them.
 */

export type GameEventType =
  | 'NIGHT_EVALUATED'
  | 'HP_CHANGED'
  | 'DEATH'
  | 'RESURRECTED'
  | 'LEVEL_UP'
  | 'CHEST_AWARDED'
  | 'WINDOW_CHANGED';

export interface GameEvent {
  type: GameEventType;
  at: string; // ISO timestamp
  payload?: Record<string, unknown>;
}
