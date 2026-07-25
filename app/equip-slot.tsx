import { useLocalSearchParams } from 'expo-router'

import { EquipSlotScreen } from '../src/screens/EquipSlotScreen'

type SlotParam = 'armor' | 'utilities' | 'charm'

function parseSlot(raw: string | string[] | undefined): SlotParam {
  const value = Array.isArray(raw) ? raw[0] : raw
  if (value === 'utilities') return 'utilities'
  if (value === 'charm') return 'charm'
  return 'armor'
}

export default function EquipSlotRoute() {
  const { slot } = useLocalSearchParams<{ slot: string | string[] }>()
  return <EquipSlotScreen slot={parseSlot(slot)} />
}
