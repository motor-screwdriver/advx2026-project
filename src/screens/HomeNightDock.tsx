import { useRouter } from 'expo-router'
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { GearButton } from '../ui/GearButton'
import { HeartRow } from '../ui/HeartRow'
import { strings } from '../ui/strings'
import { GoldButton, TavernBar, WoodPanel, tavernColors } from '../ui/tavern'
import { theme } from '../ui/theme'
import { HomeNav } from './HomeNav'

const XP_LABEL = 'XP'
const XP_PER_LEVEL = 700 // engine value copy (screens stay off direct engine imports)

/** Riveted wood panel: hearts row on top, LV badge + XP bar below (compact,
 * reference mockup: the HUD hugs the top so the moon stays clear of it). */
export function TopBar({ hp, xp, level }: { hp: number; xp: number; level: number }) {
  return (
    <WoodPanel contentStyle={styles.topPanelWell}>
      <View style={styles.heartsRow}>
        <HeartRow hp={hp} size={20} />
      </View>
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
          <TavernBar value={xp % XP_PER_LEVEL} max={XP_PER_LEVEL} />
        </View>
        <HomeNav />
      </View>
    </WoodPanel>
  )
}

/** Night dock, one row like the reference mockup: big gold WAKE UP + gear. */
export function Dock({ onWake }: { onWake: () => void }) {
  const router = useRouter()
  return (
    <WoodPanel contentStyle={styles.dockWell}>
      <GoldButton style={styles.sleepBtn} label={strings.home_wakeup} onPress={onWake} />
      <GearButton onPress={() => router.push('/settings')} />
    </WoodPanel>
  )
}

const styles = StyleSheet.create({
  topPanelWell: { padding: theme.spacing(2.5), gap: theme.spacing(2) },
  heartsRow: { alignItems: 'center' },
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
})
