import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { ICONS } from '../../assets/manifest'
import { PixelSprite } from '../ui/PixelSprite'
import { useScreenTransition } from '../ui/screenTransition'
import { strings } from '../ui/strings'
import {
  ScreenTitle,
  tavernColors,
  TavernFrame,
  tavernLayout,
  WoodButton,
  WoodPanel,
} from '../ui/tavern'
import { theme } from '../ui/theme'
import { useGame } from '../ui/useGame'

function humanize(id: string): string {
  return id
    .split('_')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ')
}

function slotIcon(id: string) {
  const artKey = `art_${id}` as keyof typeof ICONS
  if (ICONS[artKey]) return ICONS[artKey]
  const cosKey = `cos_${id.replace('cosmetic_', '')}` as keyof typeof ICONS
  return ICONS[cosKey] ?? null
}

export function InventoryScreen() {
  const go = useScreenTransition()
  const { state } = useGame()
  const { equipped } = state

  return (
    <SafeAreaView style={styles.safe}>
      <TavernFrame>
        <View style={styles.stack}>
          <ScreenTitle title={strings.inventory_title.toUpperCase()} />
          <View style={styles.slots}>
            <EquipSlot
              label={strings.inventory_armor}
              artifact={equipped.armor}
              onPress={() => go('/equip-slot', { params: { slot: 'armor' } })}
            />
            <EquipSlot
              label={strings.inventory_utilities}
              artifact={equipped.utilities}
              onPress={() => go('/equip-slot', { params: { slot: 'utilities' } })}
            />
            <EquipSlot
              label={strings.inventory_charm}
              artifact={equipped.charm}
              onPress={() => go('/equip-slot', { params: { slot: 'charm' } })}
            />
          </View>
          <Text style={styles.hint}>{strings.inventory_hint}</Text>
          <WoodButton label="CLOSE" onPress={() => go.back()} style={styles.close} />
        </View>
      </TavernFrame>
    </SafeAreaView>
  )
}

interface SlotProps {
  label: string
  artifact: string | null
  onPress: () => void
}

function EquipSlot({ label, artifact, onPress }: SlotProps) {
  const icon = artifact ? slotIcon(artifact) : null
  return (
    <View style={styles.slotColumn}>
      <Text style={styles.slotLabel}>{label.toUpperCase()}</Text>
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <WoodPanel contentStyle={styles.slotWell}>
          {artifact ? (
            <>
              {icon ? (
                <PixelSprite sprite={icon} size={48} animated={false} />
              ) : (
                <View style={styles.charmBadge}>
                  <Text style={styles.charmEmoji}>{charmEmoji(artifact)}</Text>
                </View>
              )}
              <Text style={styles.slotValue}>{humanize(artifact)}</Text>
            </>
          ) : (
            <View style={styles.dashedWell}>
              <Text style={styles.slotPlus}>+</Text>
            </View>
          )}
        </WoodPanel>
      </TouchableOpacity>
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
function charmEmoji(id: string): string {
  return CHARM_EMOJI[id] ?? '💎'
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#150d08' },
  stack: { gap: tavernLayout.sectionGap, paddingBottom: theme.spacing(2) },
  slots: { flexDirection: 'row', gap: theme.spacing(2), marginTop: theme.spacing(8) },
  slotColumn: { flex: 1, gap: theme.spacing(1) },
  slotLabel: {
    ...theme.type.body,
    color: tavernColors.gold,
    textAlign: 'center',
    letterSpacing: 2,
    fontSize: 8,
  },
  slotWell: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing(1),
    minHeight: 110,
  },
  slotValue: { ...theme.type.label, color: tavernColors.gold, textAlign: 'center' },
  charmBadge: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2a1a0e',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: tavernColors.gold,
  },
  charmEmoji: { fontSize: 24 },
  dashedWell: {
    alignSelf: 'stretch',
    flex: 1,
    minHeight: 80,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: tavernColors.dark,
  },
  slotPlus: { ...theme.type.title, fontSize: 24, lineHeight: 32, color: theme.colors.textDim },
  hint: { ...theme.type.label, color: theme.colors.textDim, textAlign: 'center' },
  close: { marginHorizontal: theme.spacing(6) },
})
