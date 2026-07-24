import { useRouter } from 'expo-router'
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { GearButton } from '../ui/GearButton'
import { HeartRow } from '../ui/HeartRow'
import { strings } from '../ui/strings'
import { GoldButton, TavernBar, WoodButton, WoodPanel, tavernColors } from '../ui/tavern'
import { theme } from '../ui/theme'

const MAX_HP = 7

// Local copy (design-mockup label; not in strings.ts).
const XP_LABEL = 'XP'

/** Riveted wood panel: hearts row on top, LV badge + XP bar below. */
export function TopBar({ hp, streak, level }: { hp: number; streak: number; level: number }) {
  return (
    <WoodPanel contentStyle={styles.topPanelWell}>
      <HeartRow hp={hp} size={26} />
      <View style={styles.xpRow}>
        <View style={styles.lvBadge}>
          <View style={styles.lvBadgeInner}>
            <Text style={styles.lvText}>
              {strings.home_level} {level}
            </Text>
          </View>
        </View>
        <Text style={styles.xpLabel}>{XP_LABEL}</Text>
        <View style={styles.xpBarWrap}>
          <TavernBar value={streak} max={MAX_HP} />
        </View>
      </View>
    </WoodPanel>
  )
}

/** Night dock: big gold WAKE UP, wood BAG + MOSAIC, round gear. */
export function Dock({ onWake }: { onWake: () => void }) {
  const router = useRouter()
  return (
    <WoodPanel contentStyle={styles.dockWell}>
      <GoldButton style={styles.sleepBtn} label={strings.home_wakeup} onPress={onWake} />
      <View style={styles.dockSide}>
        <WoodButton
          compact
          label={strings.home_nav_bag}
          onPress={() => router.push('/inventory')}
        />
        <WoodButton
          compact
          label={strings.home_nav_mosaic}
          onPress={() => router.push('/mosaic')}
        />
      </View>
      <GearButton onPress={() => router.push('/settings')} />
    </WoodPanel>
  )
}

const styles = StyleSheet.create({
  topPanelWell: { gap: theme.spacing(3) },
  xpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing(2.5),
  },
  lvBadge: {
    backgroundColor: tavernColors.goldEdge,
    borderWidth: 2,
    borderColor: tavernColors.edge,
    padding: 2,
  },
  lvBadgeInner: {
    backgroundColor: '#20130b',
    borderTopWidth: 2,
    borderTopColor: tavernColors.goldLight,
    borderBottomWidth: 2,
    borderBottomColor: tavernColors.gold,
    paddingHorizontal: theme.spacing(2.5),
    paddingVertical: theme.spacing(1.5),
  },
  lvText: {
    fontFamily: theme.fontFamily,
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 1,
    color: tavernColors.goldLight,
  },
  xpLabel: {
    ...theme.type.body,
    color: theme.colors.text,
  },
  xpBarWrap: { flex: 1 },
  dockWell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing(2.5),
  },
  sleepBtn: { flex: 1 },
  dockSide: { width: 96, gap: theme.spacing(2) },
})
