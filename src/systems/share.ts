/**
 * Mosaic sharing (P1): capture a view (Dev A passes the Mosaic screen ref)
 * to PNG and hand it to the OS share sheet via expo-sharing. Silent no-op
 * when sharing is unavailable — sharing never breaks the game.
 */
import type { RefObject } from 'react';
import type { View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

export async function shareViewAsPng(
  target: RefObject<View | null>,
  dialogTitle: string,
): Promise<boolean> {
  try {
    if (!(await Sharing.isAvailableAsync())) {
      return false;
    }
    const uri = await captureRef(target, { format: 'png', quality: 1 });
    await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle });
    return true;
  } catch (error) {
    console.log('[share] failed (silent):', error);
    return false;
  }
}
