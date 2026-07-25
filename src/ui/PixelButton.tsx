import React from 'react'

import { TavernButton } from './tavernControls'

interface Props {
  label: string
  onPress?: () => void
  compact?: boolean
  disabled?: boolean
}

/**
 * @deprecated Kept for older screens — now a thin alias of the ONE unified
 * tavern button (see tavernControls.tsx): same riveted edge, bevel body,
 * pixel-bold label and press-sink as GoldButton/WoodButton. New code should
 * use TavernButton / GoldButton / WoodButton directly.
 */
export function PixelButton({ label, onPress, compact, disabled }: Props) {
  return <TavernButton label={label} onPress={onPress} compact={compact} disabled={disabled} />
}
