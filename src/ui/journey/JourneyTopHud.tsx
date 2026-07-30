import { Image as ExpoImage } from 'expo-image'
import React, { useState } from 'react'
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native'

import { JOURNEY } from '../../../assets/manifest'
import { HeartRow } from '../HeartRow'
import { strings } from '../strings'
import { theme } from '../theme'
import { TOP_HUD, TOP_PANEL_ASPECT, hudBoxStyle } from './journeyLayout'

const XP_PER_LEVEL = 700 // engine value copy (UI stays off direct engine imports)
const XP_STATES = 7 // xp_bar_1..7 fill sprites

/** Fill sprite for the current level progress; null keeps the groove empty. */
function xpBarSprite(xp: number) {
  const progress = (xp % XP_PER_LEVEL) / XP_PER_LEVEL
  const state = Math.min(XP_STATES, Math.ceil(progress * XP_STATES))
  if (state === 0) {
    return null
  }
  return JOURNEY[`xp_bar_${state}` as keyof typeof JOURNEY]
}

/**
 * Top journey panel, drawn on the artist's `hud_top` art: hearts row in the
 * upper well, the LV number inside the baked badge slot and one of the seven
 * pre-drawn XP fills dropped exactly onto the baked groove.
 */
export function JourneyTopHud({
  hp,
  xp,
  level,
  rightAccessory,
}: {
  hp: number
  xp: number
  level: number
  rightAccessory?: React.ReactNode
}) {
  const [panelWidth, setPanelWidth] = useState(0)
  const onLayout = (event: LayoutChangeEvent) => setPanelWidth(event.nativeEvent.layout.width)
  const xpSprite = xpBarSprite(xp)

  return (
    <View style={styles.panel} onLayout={onLayout}>
      <ExpoImage
        source={JOURNEY.hud_top.source}
        style={StyleSheet.absoluteFill}
        contentFit="fill"
        cachePolicy="memory-disk"
        transition={0}
      />
      {panelWidth > 0 && (
        <>
          <View style={[hudBoxStyle(TOP_HUD.hearts), styles.heartsWell]}>
            <HeartRow hp={hp} size={Math.round(panelWidth * 0.06)} />
            {rightAccessory && <View style={styles.accessory}>{rightAccessory}</View>}
          </View>
          <View style={[hudBoxStyle(TOP_HUD.badge), styles.badgeWell]}>
            <Text
              style={[styles.lvText, { fontSize: Math.round(panelWidth * 0.042) }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {strings.home_level} {level}
            </Text>
          </View>
          {xpSprite && (
            <ExpoImage
              source={xpSprite.source}
              style={hudBoxStyle(TOP_HUD.xp)}
              contentFit="fill"
              cachePolicy="memory-disk"
              transition={0}
            />
          )}
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  panel: { width: '100%', aspectRatio: TOP_PANEL_ASPECT },
  heartsWell: { alignItems: 'center', justifyContent: 'center' },
  accessory: { position: 'absolute', right: 0, flexDirection: 'row' },
  badgeWell: { alignItems: 'center', justifyContent: 'center' },
  lvText: {
    fontFamily: theme.fontFamily,
    letterSpacing: 1,
    color: theme.colors.gold,
  },
})
