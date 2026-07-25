import { useRouter } from 'expo-router'
import React from 'react'
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { ICONS } from '../../assets/manifest'
import type { ArtifactId } from '../contracts/types'
import { type CountedItem, listArtifactsForSlot } from '../ui/artifactsMeta'
import { PixelSprite } from '../ui/PixelSprite'
import { strings } from '../ui/strings'
import { ScreenTitle, tavernColors, TavernFrame, WoodButton, WoodPanel } from '../ui/tavern'
import { theme } from '../ui/theme'
import { useGame } from '../ui/useGame'
import { CharmSlotScreen } from './CharmSlotScreen'

type SlotName = 'armor' | 'utilities' | 'charm'

interface Props {
  slot: SlotName
}

function humanize(id: string): string {
  return id
    .split('_')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ')
}

function artIcon(id: string) {
  const key = `art_${id}` as keyof typeof ICONS
  return ICONS[key] ?? null
}

function slotLabel(slot: SlotName): string {
  if (slot === 'armor') return strings.inventory_armor
  if (slot === 'utilities') return strings.inventory_utilities
  return strings.inventory_charm
}

export function EquipSlotScreen({ slot }: Props) {
  const router = useRouter()
  const { state, equip, unequip, equipCosmetic, useHourglass } = useGame()
  const { equipped, artifacts, cosmetics } = state

  if (slot === 'charm') {
    return (
      <CharmSlotScreen
        cosmetics={cosmetics ?? []}
        current={equipped.charm}
        onEquip={equipCosmetic}
        onUnequip={() => unequip('charm')}
        onBack={() => router.back()}
      />
    )
  }
  const current = equipped[slot]
  const { equippable, tools } = listArtifactsForSlot(artifacts, slot, current)

  return (
    <SafeAreaView style={styles.safe}>
      <TavernFrame>
        <ScrollView contentContainerStyle={styles.stack} showsVerticalScrollIndicator={false}>
          <ScreenTitle title={`${slotLabel(slot).toUpperCase()} SLOT`} />
          <CurrentArtifactSlot current={current} slot={slot} onUnequip={() => unequip(slot)} />
          <EquipSection equipable={equippable} slot={slot} onEquip={equip} />
          {tools.length > 0 && <ToolsSection tools={tools} onUseHourglass={useHourglass} />}
          <WoodButton
            label={strings.common_back.toUpperCase()}
            onPress={() => router.back()}
            style={styles.back}
          />
        </ScrollView>
      </TavernFrame>
    </SafeAreaView>
  )
}

/* ---------- Artifact slot components ---------- */

interface CurrentProps {
  current: ArtifactId | null
  slot: 'armor' | 'utilities'
  onUnequip: () => void
}

function CurrentArtifactSlot({ current, slot, onUnequip }: CurrentProps) {
  return (
    <WoodPanel contentStyle={styles.currentWell}>
      <Text style={styles.currentLabel}>{strings.equip_current}</Text>
      {current ? (
        <View style={styles.currentRow}>
          {artIcon(current) ? (
            <PixelSprite sprite={artIcon(current)!} size={48} animated={false} />
          ) : (
            <Text style={styles.currentName}>{humanize(current)}</Text>
          )}
          <View style={styles.currentText}>
            <Text style={styles.currentName}>{humanize(current).toUpperCase()}</Text>
            <Text style={styles.currentSlot}>{slotLabel(slot)}</Text>
          </View>
          <WoodButton compact label={strings.inventory_unequip} onPress={onUnequip} />
        </View>
      ) : (
        <Text style={styles.empty}>{strings.inventory_slot_empty}</Text>
      )}
    </WoodPanel>
  )
}

interface EquipSectionProps {
  equipable: CountedItem[]
  slot: 'armor' | 'utilities'
  onEquip: (slot: 'armor' | 'utilities', artifact: ArtifactId) => void
}

function EquipSection({ equipable, slot, onEquip }: EquipSectionProps) {
  const title = slot === 'utilities' ? strings.util_section_equippable : strings.equip_available
  return (
    <WoodPanel contentStyle={styles.listWell}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {equipable.length === 0 ? (
        <Text style={styles.empty}>{strings.equip_none}</Text>
      ) : (
        equipable.map((item, i) => (
          <EquipRow key={item.id} item={item} slot={slot} onEquip={onEquip} showDivider={i > 0} />
        ))
      )}
    </WoodPanel>
  )
}

function EquipRow({
  item,
  slot,
  onEquip,
  showDivider,
}: {
  item: CountedItem
  slot: 'armor' | 'utilities'
  onEquip: (slot: 'armor' | 'utilities', artifact: ArtifactId) => void
  showDivider: boolean
}) {
  const desc = strings[`artifact_${item.id}` as keyof typeof strings]
  const icon = artIcon(item.id)
  return (
    <View style={[styles.row, showDivider && styles.rowDivider]}>
      <View style={styles.rowMain}>
        {icon ? (
          <PixelSprite sprite={icon} size={32} animated={false} />
        ) : (
          <Text style={styles.rowName}>{humanize(item.id)}</Text>
        )}
        <View style={styles.rowText}>
          <Text style={styles.rowName}>{humanize(item.id).toUpperCase()}</Text>
          <Text style={styles.rowDesc}>{desc}</Text>
        </View>
        <Text style={styles.rowCount}>x{item.count}</Text>
      </View>
      <WoodButton
        compact
        label={strings.equip_cta}
        onPress={() => onEquip(slot, item.id)}
        style={styles.btn}
      />
    </View>
  )
}

/* ---------- Tools section (utilities only) ---------- */

function ToolsSection({
  tools,
  onUseHourglass,
}: {
  tools: CountedItem[]
  onUseHourglass: (d: string) => boolean
}) {
  return (
    <WoodPanel contentStyle={styles.listWell}>
      <Text style={styles.sectionTitle}>{strings.util_section_tools}</Text>
      {tools.map((item, i) => (
        <ToolRow key={item.id} item={item} showDivider={i > 0} onUseHourglass={onUseHourglass} />
      ))}
    </WoodPanel>
  )
}

function ToolRow({
  item,
  showDivider,
  onUseHourglass,
}: {
  item: CountedItem
  showDivider: boolean
  onUseHourglass: (d: string) => boolean
}) {
  const desc = strings[`artifact_${item.id}` as keyof typeof strings]
  const icon = artIcon(item.id)
  const badge =
    item.id === 'lucky_coin'
      ? strings.util_badge_next_chest
      : item.id === 'phoenix_feather'
        ? strings.util_badge_on_death
        : null
  const action = item.id === 'hourglass' ? strings.inventory_use : 'INFO'
  return (
    <View style={[styles.row, showDivider && styles.rowDivider]}>
      <View style={styles.rowMain}>
        {icon ? (
          <PixelSprite sprite={icon} size={32} animated={false} />
        ) : (
          <Text style={styles.rowName}>{humanize(item.id)}</Text>
        )}
        <View style={styles.rowText}>
          <Text style={styles.rowName}>{humanize(item.id).toUpperCase()}</Text>
          {badge && <Text style={styles.badge}>{badge}</Text>}
          <Text style={styles.rowDesc}>{desc}</Text>
        </View>
        <Text style={styles.rowCount}>x{item.count}</Text>
      </View>
      <WoodButton
        compact
        label={action}
        onPress={() => handleToolPress(item.id, onUseHourglass)}
        style={styles.btn}
      />
    </View>
  )
}

function handleToolPress(id: ArtifactId, onUseHourglass: (d: string) => boolean): void {
  if (id === 'hourglass') {
    const ok = onUseHourglass(new Date().toISOString().slice(0, 10))
    Alert.alert(ok ? strings.util_alert_hourglass_ok : strings.util_alert_hourglass_fail)
    return
  }
  if (id === 'lucky_coin') {
    Alert.alert(strings.util_alert_lucky_coin)
    return
  }
  if (id === 'phoenix_feather') {
    Alert.alert(strings.util_alert_phoenix)
    return
  }
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#150d08' },
  stack: { gap: theme.spacing(4), paddingBottom: theme.spacing(2) },
  currentWell: { gap: theme.spacing(3), paddingHorizontal: theme.spacing(3) },
  currentLabel: {
    ...theme.type.body,
    color: tavernColors.gold,
    textAlign: 'center',
    letterSpacing: 2,
  },
  currentRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing(3) },
  currentText: { flex: 1, gap: theme.spacing(1) },
  currentName: { ...theme.type.body, color: theme.colors.text, letterSpacing: 1 },
  currentSlot: { ...theme.type.label, color: theme.colors.textDim },
  empty: {
    ...theme.type.label,
    color: theme.colors.textDim,
    textAlign: 'center',
    paddingVertical: theme.spacing(2),
  },
  listWell: { gap: theme.spacing(2), paddingHorizontal: theme.spacing(2) },
  sectionTitle: {
    ...theme.type.body,
    color: tavernColors.gold,
    textAlign: 'center',
    letterSpacing: 2,
  },
  row: { gap: theme.spacing(2), paddingTop: theme.spacing(2) },
  rowDivider: { borderTopWidth: 1, borderTopColor: tavernColors.dark },
  rowMain: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing(3) },
  rowText: { flex: 1, gap: theme.spacing(1) },
  rowName: { ...theme.type.body, color: theme.colors.text, letterSpacing: 1 },
  rowDesc: { ...theme.type.label, color: theme.colors.textDim },
  rowCount: { ...theme.type.body, color: theme.colors.text },
  badge: { ...theme.type.label, color: tavernColors.gold },
  btn: { alignSelf: 'flex-end' },
  back: { marginHorizontal: theme.spacing(6) },
})
