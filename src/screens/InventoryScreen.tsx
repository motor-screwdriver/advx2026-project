import { useRouter } from 'expo-router'
import React from 'react'
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { DESIGN } from '../../assets/manifest'
import { PixelSprite } from '../ui/PixelSprite'
import { theme } from '../ui/theme'
import { useGame } from '../ui/useGame'

import { buildBagItems, type Section, SECTIONS, sectionTitle } from './bagMeta'
import { EquipSlot, ItemsPanel } from './BagParts'

export function InventoryScreen() {
  const router = useRouter()
  const { width } = useWindowDimensions()
  const { state, equip, unequip, equipCosmetic, useHourglass } = useGame()
  const { equipped, artifacts, cosmetics } = state
  const [section, setSection] = React.useState<Section | null>(null)
  const toggle = (key: Section) => setSection((prev) => (prev === key ? null : key))
  const items = buildBagItems(section, artifacts, cosmetics ?? [], equipped, {
    equip,
    unequip,
    equipCosmetic,
    useHourglass,
  })

  const contentW = Math.min(width - theme.spacing(4), 480)
  const slotW = (contentW - theme.spacing(2) * 2) / 3

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.stage}>
        <PixelSprite sprite={DESIGN.bag_title} size={contentW * 0.78} />
        <View style={[styles.slots, { width: contentW }]}>
          {SECTIONS.map(({ key, label }) => (
            <EquipSlot
              key={key}
              label={label}
              artifact={equipped[key]}
              size={slotW}
              active={section === key}
              onPress={() => toggle(key)}
            />
          ))}
        </View>
        <ItemsPanel width={contentW} title={sectionTitle(section)} items={items} />
        <Pressable onPress={() => router.back()} style={({ pressed }) => pressed && styles.pressed}>
          <PixelSprite sprite={DESIGN.bag_button_close} size={contentW * 0.55} />
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#150d08' },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingVertical: theme.spacing(2),
  },
  slots: { flexDirection: 'row', gap: theme.spacing(2) },
  pressed: { opacity: 0.7, transform: [{ translateY: 2 }] },
})
