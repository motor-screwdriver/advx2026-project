import React from 'react'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import { DESIGN } from '../../assets/manifest'
import { PixelSprite } from '../ui/PixelSprite'
import { strings } from '../ui/strings'
import { tavernColors } from '../ui/tavern'
import { theme } from '../ui/theme'

import { type BagItem, charmEmoji, displayName, slotIcon } from './bagMeta'

// bag_panel_consumables geometry (fractions of the 1920x1540 sprite):
// ribbon band carries the live category title, rows box below it
// — see tools/slice_bag_sprites.py
const PANEL_ASPECT = 1540 / 1920
const BOX = { left: 0.046, right: 0.95, top: 0.154, bottom: 0.962 }
const RIBBON = { top: 0.015, height: 0.125 }

interface SlotProps {
  label: string
  artifact: string | null
  size: number
  active: boolean
  onPress: () => void
}

export function EquipSlot({ label, artifact, size, active, onPress }: SlotProps) {
  const icon = artifact ? slotIcon(artifact) : null
  return (
    <View style={styles.slotColumn}>
      <Text style={[styles.slotLabel, active && styles.slotLabelActive]}>
        {label.toUpperCase()}
      </Text>
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <PixelSprite
          sprite={artifact ? DESIGN.bag_slot_frame : DESIGN.bag_slot_empty}
          size={size}
        />
        {artifact ? (
          <View style={styles.slotOverlay} pointerEvents="none">
            {icon ? (
              <PixelSprite sprite={icon} size={44} animated={false} />
            ) : (
              <Text style={styles.charmEmoji}>{charmEmoji(artifact)}</Text>
            )}
          </View>
        ) : null}
      </TouchableOpacity>
      <Text style={styles.slotValue} numberOfLines={1}>
        {artifact ? displayName(artifact) : ' '}
      </Text>
    </View>
  )
}

export function ItemsPanel({
  width,
  title,
  items,
}: {
  width: number
  title: string
  items: BagItem[]
}) {
  const panelH = width * PANEL_ASPECT
  return (
    <View style={{ width, height: panelH }}>
      <PixelSprite sprite={DESIGN.bag_panel_consumables} size={width} />
      <View style={[styles.ribbon, { top: panelH * RIBBON.top, height: panelH * RIBBON.height }]}>
        <Text style={styles.ribbonTitle}>{title}</Text>
      </View>
      <View
        style={[
          styles.rowsBox,
          {
            left: width * BOX.left,
            width: width * (BOX.right - BOX.left),
            top: panelH * BOX.top,
            height: panelH * (BOX.bottom - BOX.top),
          },
        ]}
      >
        {items.length === 0 ? (
          <Text style={styles.empty}>{strings.inventory_empty}</Text>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            {items.map((item, index) => (
              <ItemRow key={item.id} item={item} divider={index > 0} />
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  )
}

function ItemRow({ item, divider }: { item: BagItem; divider: boolean }) {
  const icon = slotIcon(item.id)
  return (
    <TouchableOpacity
      onPress={item.onPress}
      activeOpacity={0.7}
      style={[styles.row, divider && styles.rowDivider]}
    >
      <View style={styles.rowIcon}>
        {icon ? (
          <PixelSprite sprite={icon} size={40} animated={false} />
        ) : (
          <Text style={styles.charmEmoji}>{charmEmoji(item.id)}</Text>
        )}
      </View>
      <Text style={styles.rowName} numberOfLines={1}>
        {item.name.toUpperCase()}
      </Text>
      {item.equipped ? <Text style={styles.rowBadge}>{strings.inventory_equipped}</Text> : null}
      {item.count > 1 ? <Text style={styles.rowCount}>x{item.count}</Text> : null}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  slotColumn: { flex: 1, gap: theme.spacing(1) },
  slotLabel: {
    ...theme.type.body,
    color: tavernColors.gold,
    textAlign: 'center',
    letterSpacing: 2,
    fontSize: 9,
    opacity: 0.7,
  },
  slotLabelActive: { opacity: 1, textDecorationLine: 'underline' },
  slotOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotValue: {
    ...theme.type.label,
    color: tavernColors.gold,
    textAlign: 'center',
    fontSize: 8,
  },
  charmEmoji: { fontSize: 28 },
  ribbon: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ribbonTitle: {
    ...theme.type.body,
    color: tavernColors.gold,
    fontSize: 13,
    letterSpacing: 3,
  },
  rowsBox: { position: 'absolute', paddingVertical: theme.spacing(1) },
  empty: {
    ...theme.type.label,
    color: theme.colors.textDim,
    textAlign: 'center',
    marginTop: theme.spacing(4),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 68,
    paddingHorizontal: theme.spacing(3),
    gap: theme.spacing(3),
  },
  rowDivider: { borderTopWidth: 2, borderTopColor: '#1e1006' },
  rowIcon: { width: 44, alignItems: 'center' },
  rowName: { ...theme.type.body, color: '#e8d5a0', fontSize: 11, flex: 1 },
  rowBadge: { ...theme.type.label, color: tavernColors.gold, fontSize: 8 },
  rowCount: { ...theme.type.body, color: '#e8d5a0', fontSize: 11 },
})
