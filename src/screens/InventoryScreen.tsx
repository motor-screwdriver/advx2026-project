import { useRouter } from 'expo-router'
import React from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { ICONS } from '../../assets/manifest'
import type { ArtifactId } from '../contracts/types'
import { PixelSprite } from '../ui/PixelSprite'
import { strings } from '../ui/strings'
import { ScreenTitle, tavernColors, TavernFrame, WoodButton, WoodPanel } from '../ui/tavern'
import { theme } from '../ui/theme'
import { useGame } from '../ui/useGame'

/** Copy from the bag mockup that has no strings.ts key yet (local only). */
const copy = {
  consumables: 'CONSUMABLES',
  close: 'CLOSE',
  emptySlotMark: '+',
} as const

function humanize(id: string): string {
  return id
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function artIcon(id: ArtifactId) {
  return ICONS[`art_${id}` as keyof typeof ICONS]
}

function artifactDesc(id: ArtifactId): string {
  return strings[`artifact_${id}` as keyof typeof strings]
}

/** Group the artifact list into [id, count] pairs, keeping first-seen order. */
function groupArtifacts(artifacts: ArtifactId[]): [ArtifactId, number][] {
  const counts = new Map<ArtifactId, number>()
  for (const artifact of artifacts) {
    counts.set(artifact, (counts.get(artifact) ?? 0) + 1)
  }
  return [...counts.entries()]
}

export function InventoryScreen() {
  const router = useRouter()
  const { state, equip } = useGame()
  const { equipped, artifacts } = state
  const grouped = groupArtifacts(artifacts)

  return (
    <SafeAreaView style={styles.safe}>
      <TavernFrame>
        <ScrollView contentContainerStyle={styles.stack} showsVerticalScrollIndicator={false}>
          <ScreenTitle title={strings.inventory_title.toUpperCase()} />
          <View style={styles.slots}>
            <EquipSlot label={strings.inventory_armor} artifact={equipped.armor} />
            <EquipSlot label={strings.inventory_charm} artifact={equipped.charm} />
          </View>
          <WoodPanel contentStyle={styles.consumablesWell}>
            <Text style={styles.sectionTitle}>{copy.consumables}</Text>
            {grouped.length === 0 ? (
              <Text style={styles.empty}>{strings.inventory_empty}</Text>
            ) : (
              grouped.map(([artifact, count], index) => (
                <ArtifactRow
                  key={artifact}
                  artifact={artifact}
                  count={count}
                  equipped={equipped}
                  onEquip={equip}
                  showDivider={index > 0}
                />
              ))
            )}
          </WoodPanel>
          <WoodButton label={copy.close} onPress={() => router.back()} style={styles.close} />
        </ScrollView>
      </TavernFrame>
    </SafeAreaView>
  )
}

interface SlotProps {
  label: string
  artifact: ArtifactId | null
}

/** One equipment slot: gold label above a riveted frame with the item or a dashed "+". */
function EquipSlot({ label, artifact }: SlotProps) {
  return (
    <View style={styles.slotColumn}>
      <Text style={styles.slotLabel}>{label.toUpperCase()}</Text>
      <WoodPanel contentStyle={styles.slotWell}>
        {artifact ? (
          <>
            {artifact === 'iron_armor' ? (
              <View style={styles.armorPlate}>
                <PixelSprite sprite={artIcon(artifact)} size={72} animated={false} />
              </View>
            ) : (
              <PixelSprite sprite={artIcon(artifact)} size={56} animated={false} />
            )}
            <Text style={styles.slotValue}>{humanize(artifact)}</Text>
          </>
        ) : (
          <View style={styles.dashedWell}>
            <Text style={styles.slotPlus}>{copy.emptySlotMark}</Text>
          </View>
        )}
      </WoodPanel>
    </View>
  )
}

interface RowProps {
  artifact: ArtifactId
  count: number
  equipped: { armor: ArtifactId | null; charm: ArtifactId | null }
  onEquip: (slot: 'armor' | 'charm', artifact: ArtifactId) => void
  showDivider: boolean
}

function ArtifactRow({ artifact, count, equipped, onEquip, showDivider }: RowProps) {
  const equippedIn =
    equipped.armor === artifact ? 'armor' : equipped.charm === artifact ? 'charm' : null
  return (
    <View style={[styles.row, showDivider && styles.rowDivider]}>
      <View style={styles.rowMain}>
        <PixelSprite sprite={artIcon(artifact)} size={32} animated={false} />
        <View style={styles.rowText}>
          <View style={styles.rowNameLine}>
            <Text style={styles.rowName}>{humanize(artifact).toUpperCase()}</Text>
            {equippedIn && (
              <Text style={styles.badge}>
                {strings.inventory_equipped}:{' '}
                {equippedIn === 'armor' ? strings.inventory_armor : strings.inventory_charm}
              </Text>
            )}
          </View>
          <Text style={styles.rowDesc}>{artifactDesc(artifact)}</Text>
        </View>
        <Text style={styles.rowCount}>x{count}</Text>
      </View>
      <View style={styles.rowActions}>
        <WoodButton
          compact
          label={strings.inventory_to_armor}
          onPress={() => onEquip('armor', artifact)}
          style={styles.rowButton}
        />
        <WoodButton
          compact
          label={strings.inventory_to_charm}
          onPress={() => onEquip('charm', artifact)}
          style={styles.rowButton}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#150d08' },
  stack: { gap: theme.spacing(4), paddingBottom: theme.spacing(2) },
  slots: { flexDirection: 'row', gap: theme.spacing(3) },
  slotColumn: { flex: 1, gap: theme.spacing(2) },
  slotLabel: {
    ...theme.type.body,
    color: tavernColors.gold,
    textAlign: 'center',
    letterSpacing: 2,
  },
  slotWell: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing(2),
    minHeight: 132,
  },
  armorPlate: { backgroundColor: '#28190d', padding: theme.spacing(1) },
  slotValue: { ...theme.type.label, color: tavernColors.gold, textAlign: 'center' },
  dashedWell: {
    alignSelf: 'stretch',
    flex: 1,
    minHeight: 96,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: tavernColors.dark,
  },
  slotPlus: { ...theme.type.title, fontSize: 24, lineHeight: 32, color: theme.colors.textDim },
  consumablesWell: { gap: theme.spacing(2), paddingHorizontal: theme.spacing(2) },
  sectionTitle: {
    ...theme.type.body,
    color: tavernColors.gold,
    textAlign: 'center',
    letterSpacing: 2,
  },
  empty: {
    ...theme.type.label,
    color: theme.colors.textDim,
    textAlign: 'center',
    paddingVertical: theme.spacing(2),
  },
  row: { gap: theme.spacing(2), paddingTop: theme.spacing(2) },
  rowDivider: { borderTopWidth: 1, borderTopColor: tavernColors.dark },
  rowMain: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing(3) },
  rowText: { flex: 1, gap: theme.spacing(1) },
  rowNameLine: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing(2),
  },
  rowName: { ...theme.type.body, color: theme.colors.text, letterSpacing: 1 },
  badge: { ...theme.type.label, color: theme.colors.leaf },
  rowDesc: { ...theme.type.label, color: theme.colors.textDim },
  rowCount: { ...theme.type.body, color: theme.colors.text },
  rowActions: { flexDirection: 'row', gap: theme.spacing(2) },
  rowButton: { flex: 1 },
  close: { marginHorizontal: theme.spacing(6) },
})
