import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { ICONS } from '../../assets/manifest'
import { PixelSprite } from './PixelSprite'
import { strings } from './strings'
import { tavernColors } from './tavern'
import { theme } from './theme'

const MAX_HP = 7

/** Riveted brass plate holding the hero's level, right end of the strip. */
function LevelBadge({ level, height }: { level: number; height: number }) {
  const font = Math.round(height * 0.32)
  return (
    <View style={styles.badge}>
      <View
        style={[
          styles.badgeFace,
          { paddingHorizontal: height * 0.2, paddingVertical: height * 0.08 },
        ]}
      >
        <Text style={[styles.badgeText, { fontSize: font, lineHeight: Math.round(font * 1.4) }]}>
          {strings.home_lvl} {level}
        </Text>
      </View>
    </View>
  )
}

/**
 * The hero's vitals, laid into the empty strip at the top of the start screen
 * backdrop: hearts filling it from the left, level plate pinned to the right.
 * Everything is sized off the strip's own height so it stays in proportion with
 * the art on any screen.
 */
export function StartStatusStrip({
  hp,
  level,
  height,
}: {
  hp: number
  level: number
  height: number
}) {
  return (
    <View style={[styles.strip, { paddingHorizontal: height * 0.2 }]}>
      <View style={[styles.hearts, { gap: Math.round(height * 0.06) }]}>
        {Array.from({ length: MAX_HP }, (_, i) => (
          <PixelSprite
            key={i}
            sprite={i < hp ? ICONS.heart_full : ICONS.heart_empty}
            size={Math.round(height * 0.6)}
          />
        ))}
      </View>
      <LevelBadge level={level} height={height} />
    </View>
  )
}

const styles = StyleSheet.create({
  strip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hearts: { flexDirection: 'row', alignItems: 'center' },
  badge: {
    padding: 2,
    borderWidth: 2,
    borderColor: tavernColors.edge,
    backgroundColor: tavernColors.goldEdge,
  },
  badgeFace: {
    borderTopWidth: 2,
    borderTopColor: tavernColors.goldLight,
    borderBottomWidth: 2,
    borderBottomColor: tavernColors.gold,
    backgroundColor: '#20130b',
  },
  badgeText: {
    fontFamily: theme.fontFamily,
    letterSpacing: 1,
    color: tavernColors.goldLight,
  },
})
