import { useFonts } from 'expo-font';

import { GAME_FONT } from './theme';

/**
 * Loads the bundled Press Start 2P font (assets/fonts/).
 * Returns true once loading finished OR failed — on failure the app
 * proceeds with the system font (graceful degradation, NFR-15).
 */
export function useGameFonts(): boolean {
  const [loaded, error] = useFonts({
    [GAME_FONT]: require('../../assets/fonts/PressStart2P-Regular.ttf'),
  });
  return loaded || error !== null;
}
