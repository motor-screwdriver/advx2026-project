/**
 * App entry. expo-router boots the UI; the widget init registers the
 * headless Android home-screen widget task alongside it (the same bundle is
 * what the launcher runs for widget updates). No-op in Expo Go / web.
 */
import 'expo-router/entry'

import { initHomeWidgets } from './src/systems/widgets'

initHomeWidgets()
