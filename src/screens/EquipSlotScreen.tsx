import React from 'react'
import { ScrollView, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { listArtifactsForSlot } from '../ui/artifactsMeta'
import { useScreenTransition } from '../ui/screenTransition'
import { strings } from '../ui/strings'
import { ScreenTitle, TavernFrame, WoodButton } from '../ui/tavern'
import { theme } from '../ui/theme'
import { useGame } from '../ui/useGame'
import { CharmSlotScreen } from './CharmSlotScreen'
import { CurrentArtifactSlot, EquipSection, ToolsSection, slotLabel } from './EquipSlotParts'

type SlotName = 'armor' | 'utilities' | 'charm'

interface Props {
  slot: SlotName
}

export function EquipSlotScreen({ slot }: Props) {
  const go = useScreenTransition()
  const { state, equip, unequip, equipCosmetic, useHourglass } = useGame()
  const { equipped, artifacts, cosmetics } = state

  if (slot === 'charm') {
    return (
      <CharmSlotScreen
        cosmetics={cosmetics ?? []}
        current={equipped.charm}
        onEquip={equipCosmetic}
        onUnequip={() => unequip('charm')}
        onBack={() => go.back()}
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
            onPress={() => go.back()}
            style={styles.back}
          />
        </ScrollView>
      </TavernFrame>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#150d08' },
  stack: { gap: theme.spacing(4), paddingBottom: theme.spacing(2) },
  back: { marginHorizontal: theme.spacing(6) },
})
