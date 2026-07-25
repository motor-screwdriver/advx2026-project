import React from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { ICONS } from '../../assets/manifest'
import type { CosmeticId } from '../contracts/types'
import { COSMETIC_META, listCosmeticsForCharm } from '../ui/artifactsMeta'
import { PixelSprite } from '../ui/PixelSprite'
import { strings } from '../ui/strings'
import { ScreenTitle, tavernColors, TavernFrame, WoodButton, WoodPanel } from '../ui/tavern'
import { theme } from '../ui/theme'

interface Props {
  cosmetics: CosmeticId[]
  current: CosmeticId | null
  onEquip: (c: CosmeticId) => void
  onUnequip: () => void
  onBack: () => void
}

function humanize(id: string): string {
  return id
    .split('_')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ')
}

function cosIcon(id: CosmeticId) {
  const short = id.replace('cosmetic_', '')
  const key = `cos_${short}` as keyof typeof ICONS
  return ICONS[key] ?? null
}

function cosmeticName(id: CosmeticId): string {
  return COSMETIC_META[id]?.name ?? humanize(id)
}

export function CharmSlotScreen({ cosmetics, current, onEquip, onUnequip, onBack }: Props) {
  const available = listCosmeticsForCharm(cosmetics, current)
  return (
    <SafeAreaView style={styles.safe}>
      <TavernFrame>
        <ScrollView contentContainerStyle={styles.stack} showsVerticalScrollIndicator={false}>
          <ScreenTitle title={`${strings.inventory_charm.toUpperCase()} SLOT`} />
          <WoodPanel contentStyle={styles.currentWell}>
            <Text style={styles.currentLabel}>{strings.equip_current}</Text>
            {current ? (
              <View style={styles.currentRow}>
                <CosmeticIcon id={current} size={48} />
                <View style={styles.currentText}>
                  <Text style={styles.currentName}>{cosmeticName(current)}</Text>
                </View>
                <WoodButton compact label={strings.inventory_unequip} onPress={onUnequip} />
              </View>
            ) : (
              <Text style={styles.empty}>{strings.inventory_slot_empty}</Text>
            )}
          </WoodPanel>
          <WoodPanel contentStyle={styles.listWell}>
            <Text style={styles.sectionTitle}>{strings.equip_available}</Text>
            {available.length === 0 && cosmetics.length === 0 ? (
              <Text style={styles.empty}>{strings.equip_charm_empty}</Text>
            ) : available.length === 0 ? (
              <Text style={styles.empty}>{strings.equip_none}</Text>
            ) : (
              available.map((c, i) => (
                <CosmeticRow key={c} id={c} onEquip={onEquip} showDivider={i > 0} />
              ))
            )}
          </WoodPanel>
          <WoodButton
            label={strings.common_back.toUpperCase()}
            onPress={onBack}
            style={styles.back}
          />
        </ScrollView>
      </TavernFrame>
    </SafeAreaView>
  )
}

function CosmeticIcon({ id, size }: { id: CosmeticId; size: number }) {
  const icon = cosIcon(id)
  if (icon) return <PixelSprite sprite={icon} size={size} animated={false} />
  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#2a1a0e',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#c8a455',
      }}
    >
      <Text style={{ fontSize: size * 0.5 }}>{CHARM_EMOJI[id] ?? '💎'}</Text>
    </View>
  )
}

const CHARM_EMOJI: Record<string, string> = {
  cosmetic_ember: '🔥',
  cosmetic_hat: '🎩',
  cosmetic_aura: '✨',
  cosmetic_pet: '🐾',
  cosmetic_frame: '🖼️',
  cosmetic_gold: '👑',
}

function CosmeticRow({
  id,
  onEquip,
  showDivider,
}: {
  id: CosmeticId
  onEquip: (c: CosmeticId) => void
  showDivider: boolean
}) {
  return (
    <View style={[styles.row, showDivider && styles.rowDivider]}>
      <View style={styles.rowMain}>
        <CosmeticIcon id={id} size={32} />
        <View style={styles.rowText}>
          <Text style={styles.rowName}>{cosmeticName(id).toUpperCase()}</Text>
        </View>
      </View>
      <WoodButton
        compact
        label={strings.equip_cta}
        onPress={() => onEquip(id)}
        style={styles.btn}
      />
    </View>
  )
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
  btn: { alignSelf: 'flex-end' },
  back: { marginHorizontal: theme.spacing(6) },
})
