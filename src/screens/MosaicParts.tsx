import React from 'react'
import { StyleSheet, View } from 'react-native'

import { strings } from '../ui/strings'
import { GoldButton, StatBadge, tavernColors } from '../ui/tavern'
import { theme } from '../ui/theme'

/** Copy from the mosaic mockup that has no strings.ts key yet (local only). */
const copy = {
  share: 'SHARE',
} as const

/** Small diamond ornament flanking the title-style SHARE button. */
function Diamond() {
  return <View style={styles.diamond} />
}

interface BadgesProps {
  level: number
  streak: number
  perfectPct: number
}

/** Row of three stat badges: hero level, perfect-week streak, perfect-night %. */
export function BadgesRow({ level, streak, perfectPct }: BadgesProps) {
  return (
    <View style={styles.badges}>
      <View style={styles.badge}>
        <StatBadge label={strings.mosaic_level.toUpperCase()} value={String(level)} />
      </View>
      <View style={styles.badge}>
        <StatBadge label={strings.mosaic_streak.toUpperCase()} value={String(streak)} />
      </View>
      <View style={styles.badge}>
        <StatBadge label={strings.mosaic_perfect.toUpperCase()} value={`${perfectPct}%`} />
      </View>
    </View>
  )
}

/** SHARE row: the gold button flanked by two diamond ornaments. */
export function ShareRow({ onShare }: { onShare: () => void }) {
  return (
    <View style={styles.shareRow}>
      <Diamond />
      <GoldButton style={styles.shareButton} label={copy.share} onPress={onShare} />
      <Diamond />
    </View>
  )
}

const styles = StyleSheet.create({
  badges: {
    flexDirection: 'row',
    gap: theme.spacing(2),
  },
  badge: { flex: 1 },
  shareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing(3),
  },
  shareButton: { flex: 1 },
  diamond: {
    width: 8,
    height: 8,
    backgroundColor: tavernColors.rivet,
    transform: [{ rotate: '45deg' }],
  },
})
