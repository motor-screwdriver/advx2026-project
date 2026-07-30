import { Image as ExpoImage } from 'expo-image'
import React, { useState } from 'react'
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native'

import { JOURNEY } from '../../../assets/manifest'
import { strings } from '../strings'
import { theme } from '../theme'
import { BOTTOM_PANEL_ASPECT, DOCK, hudBoxStyle } from './journeyLayout'
import { SpriteButton } from './SpriteButton'

/**
 * Bottom journey dock on the artist's `hud_bottom` art. The three live
 * buttons cover the baked slots 1:1; the gold plate ships blank (the SLEEP
 * engraving is inpainted away by the pipeline), so the night label — WAKE UP
 * — is typeset here with the game font and nudged down while pressed, like
 * the plate art itself.
 */
export function JourneyDock({
  onWake,
  onBag,
  onSettings,
}: {
  onWake: () => void
  onBag: () => void
  onSettings: () => void
}) {
  const [panelWidth, setPanelWidth] = useState(0)
  const onLayout = (event: LayoutChangeEvent) => setPanelWidth(event.nativeEvent.layout.width)

  return (
    <View style={styles.panel} onLayout={onLayout}>
      <ExpoImage
        source={JOURNEY.hud_bottom.source}
        style={StyleSheet.absoluteFill}
        contentFit="fill"
        cachePolicy="memory-disk"
        transition={0}
      />
      {panelWidth > 0 && (
        <>
          <WakePlateButton panelWidth={panelWidth} onWake={onWake} />
          <SpriteButton
            sprite={JOURNEY.btn_bag}
            spritePressed={JOURNEY.btn_bag_pressed}
            onPress={onBag}
            accessibilityLabel={strings.home_nav_bag}
            style={hudBoxStyle(DOCK.bag)}
          />
          <SpriteButton
            sprite={JOURNEY.btn_settings}
            spritePressed={JOURNEY.btn_settings_pressed}
            onPress={onSettings}
            accessibilityLabel={strings.settings_title}
            style={hudBoxStyle(DOCK.settings)}
          />
        </>
      )}
    </View>
  )
}

function WakePlateButton({ panelWidth, onWake }: { panelWidth: number; onWake: () => void }) {
  return (
    <SpriteButton
      sprite={JOURNEY.plate}
      spritePressed={JOURNEY.plate_pressed}
      onPress={onWake}
      accessibilityLabel={strings.home_wakeup}
      style={hudBoxStyle(DOCK.plate)}
    >
      {(pressed) => (
        <View style={[styles.plateLabelBox, pressed && styles.plateLabelBoxPressed]}>
          <Text
            style={[styles.plateLabel, { fontSize: Math.round(panelWidth * 0.062) }]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {strings.home_wakeup.toUpperCase()}
          </Text>
        </View>
      )}
    </SpriteButton>
  )
}

const styles = StyleSheet.create({
  panel: { width: '100%', aspectRatio: BOTTOM_PANEL_ASPECT },
  // Label stays inside the plate's inner bevel (art margins, not text metrics).
  plateLabelBox: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: '12%',
  },
  plateLabelBoxPressed: { transform: [{ translateY: 2 }] },
  plateLabel: {
    fontFamily: theme.fontFamily,
    letterSpacing: 2,
    color: '#3a2213', // engraved dark brown, matches the erased SLEEP glyphs
  },
})
