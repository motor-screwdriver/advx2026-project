import { Jacquard24_400Regular } from '@expo-google-fonts/jacquard-24'
import { useFonts } from 'expo-font'

import { GAME_FONT, SCRIPT_FONT } from './theme'

/**
 * Loads the bundled Press Start 2P font (assets/fonts/) plus the Jacquard 24
 * pixel blackletter used for ink script on the book page.
 * Returns true once loading finished OR failed — on failure the app
 * proceeds with the system font (graceful degradation, NFR-15).
 */
export function useGameFonts(): boolean {
  const [loaded, error] = useFonts({
    [GAME_FONT]: require('../../assets/fonts/PressStart2P-Regular.ttf'),
    [SCRIPT_FONT]: Jacquard24_400Regular,
  })
  return loaded || error !== null
}
