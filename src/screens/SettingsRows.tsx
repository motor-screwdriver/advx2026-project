import React, { useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { DESIGN } from '../../assets/manifest'
import { useMiFitnessStore } from '../state/mifitStore'
import { SpriteRow, spriteColors } from '../ui/settingsSprite'
import { strings } from '../ui/strings'
import { theme } from '../ui/theme'
import { EinkLinkPanel } from './EinkLinkPanel'
import { MiFitnessPanel } from './MiFitnessPanel'

/**
 * Expandable plank rows of the sprite settings screen (split from
 * SettingsScreen.tsx for the 250-line cap): dynamic value/label overlays
 * plus the MI FIT (Xiaomi account) and E-INK DEVICE rows that unfold
 * their link panels underneath.
 */

/** Right-aligned dynamic value overlaid on a plank slice, sprite-metric. */
export function RowValue({
  text,
  k,
  right,
  size,
  color = spriteColors.tan,
}: {
  text: string
  k: number
  right: number
  size: number
  color?: string
}) {
  return (
    <View style={[styles.valueBox, { paddingRight: right * k }]}>
      <Text style={[styles.valueText, { fontSize: size * k, color }]}>{text}</Text>
    </View>
  )
}

/** Left-aligned plank label overlay for rows built on the blank plank. */
function RowLabel({ text, k }: { text: string; k: number }) {
  const shadow = { textShadowOffset: { width: 0, height: 4 * k } }
  return (
    <View style={[styles.labelBox, { paddingLeft: 174 * k }]}>
      <Text style={[styles.labelText, { fontSize: 96 * k }, shadow]}>{text}</Text>
    </View>
  )
}

/** Gold "Connected"/"Linked" status shared by the link rows. */
function LinkedBadge({ text, k }: { text: string; k: number }) {
  return <RowValue text={text} k={k} right={175} size={72} color={spriteColors.gold} />
}

/** MI FIT plank on the blank slice; tap to expand the Xiaomi login panel. */
export function MiFitRow({ k, rowW, delay }: { k: number; rowW: number; delay: number }) {
  const [open, setOpen] = useState(false)
  const connected = useMiFitnessStore((s) => s.connected)
  return (
    <>
      <SpriteRow
        entry={DESIGN.settings_row_blank}
        k={k}
        onPress={() => setOpen((o) => !o)}
        delay={delay}
      >
        <RowLabel text={strings.settings_mifit} k={k} />
        {connected && <LinkedBadge text={strings.settings_connected} k={k} />}
      </SpriteRow>
      {open && (
        <View style={{ width: rowW }}>
          <MiFitnessPanel />
        </View>
      )}
    </>
  )
}

/** E-INK DEVICE plank; tap to expand the link form below it. */
export function EinkRow({ k, rowW, delay }: { k: number; rowW: number; delay: number }) {
  const [open, setOpen] = useState(false)
  const [linked, setLinked] = useState(false)
  return (
    <>
      <SpriteRow
        entry={linked ? DESIGN.settings_row_eink_off : DESIGN.settings_row_eink}
        k={k}
        onPress={() => setOpen((o) => !o)}
        delay={delay}
      >
        {linked && <LinkedBadge text={strings.settings_linked} k={k} />}
      </SpriteRow>
      {open && (
        <View style={{ width: rowW }}>
          <EinkLinkPanel onLinked={() => setLinked(true)} />
        </View>
      )}
    </>
  )
}

const styles = StyleSheet.create({
  valueBox: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  valueText: {
    fontFamily: theme.fontFamily,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  labelBox: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    alignItems: 'center',
  },
  labelText: {
    fontFamily: theme.fontFamily,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: spriteColors.cream,
    textShadowColor: spriteColors.outline,
    textShadowRadius: 0,
  },
})
