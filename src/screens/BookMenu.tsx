import { useRouter } from 'expo-router'
import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { ICONS } from '../../assets/manifest'
import { HeartRow } from '../ui/HeartRow'
import { PixelSprite } from '../ui/PixelSprite'
import { strings } from '../ui/strings'
import { CornerRivets, TavernBar, tavernColors, TavernFrame, WoodPanel } from '../ui/tavern'
import { theme } from '../ui/theme'
import { DevTools } from './DevTools'

const MAX_HP = 7

interface Props {
  hp: number
  streak: number
  level: number
  onSleep: () => void
}

/** Nav icons as gold pixel bitmaps, space-separated rows (GearButton idiom). */
const GLYPHS = {
  mosaic: 'XX.XX.XX XX.XX.XX ........ XX.XX.XX XX.XX.XX ........ XX.XX.XX XX.XX.XX',
  bag: '..XXXX.. .XXXXXX. XXXXXXXX XX.XX.XX XX.XX.XX XXXXXXXX XXXXXXXX .XXXXXX.',
  gear: '.XX..XX. XXXXXXXX XXX..XXX XX....XX XX....XX XXX..XXX XXXXXXXX .XX..XX.',
} as const

/** Flat gold pixel glyph rendered from a bitmap string. */
function PixelGlyph({ bitmap, size }: { bitmap: string; size: number }) {
  const cell = size / 8
  return (
    <View style={{ width: size, height: size, flexDirection: 'row', flexWrap: 'wrap' }}>
      {bitmap
        .split(' ')
        .join('')
        .split('')
        .map((pixel, i) => (
          <View
            key={i}
            style={{
              width: cell,
              height: cell,
              backgroundColor: pixel === 'X' ? tavernColors.gold : 'transparent',
            }}
          />
        ))}
    </View>
  )
}

/** Top bar: hearts + streak well on the left, gold LV badge on the right. */
function TopBar({ hp, streak, level }: { hp: number; streak: number; level: number }) {
  return (
    <WoodPanel contentStyle={styles.topBarWell}>
      <View style={styles.heartsCol}>
        <HeartRow hp={hp} max={MAX_HP} size={18} />
        <View style={styles.streakRow}>
          <Text style={styles.streakLabel}>{strings.stat_streak}</Text>
          <View style={styles.streakBar}>
            <TavernBar value={streak} max={MAX_HP} color={theme.colors.gold} height={6} />
          </View>
        </View>
      </View>
      <View style={styles.lvBadge}>
        <Text style={styles.lvText}>
          {strings.home_level} {level}
        </Text>
      </View>
    </WoodPanel>
  )
}

/** Big honey-gold SLEEP action with the open-book icon (mockup's main CTA). */
function SleepButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.sleepEdge, pressed && styles.pressed]}
    >
      <View style={styles.sleepBody}>
        <PixelSprite sprite={ICONS.book_open} size={32} />
        <Text style={styles.sleepLabel}>{strings.home_sleep.toUpperCase()}</Text>
      </View>
      <CornerRivets size={4} inset={5} />
    </Pressable>
  )
}

/** Small wood nav button: gold pixel glyph over a label (MOSAIC/BAG/SETTINGS). */
function NavButton({
  glyph,
  label,
  onPress,
}: {
  glyph: string
  label: string
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.navEdge, pressed && styles.pressed]}
    >
      <View style={styles.navBody}>
        <PixelGlyph bitmap={glyph} size={24} />
        <Text style={styles.navLabel}>{label}</Text>
      </View>
      <CornerRivets size={4} inset={5} />
    </Pressable>
  )
}

/** Awake home: the closed storybook is the game's main menu. */
export function BookMenu({ hp, streak, level, onSleep }: Props) {
  const router = useRouter()
  return (
    <SafeAreaView style={styles.safe}>
      <TavernFrame>
        <View style={styles.stack}>
          <TopBar hp={hp} streak={streak} level={level} />
          <View style={styles.bookWrap}>
            <View style={styles.book}>
              <Text style={styles.bookTitle}>8BIT SLEEP</Text>
            </View>
          </View>
          <SleepButton onPress={onSleep} />
          <View style={styles.navRow}>
            <NavButton
              glyph={GLYPHS.mosaic}
              label={strings.home_nav_mosaic}
              onPress={() => router.push('/mosaic')}
            />
            <NavButton
              glyph={GLYPHS.bag}
              label={strings.home_nav_bag}
              onPress={() => router.push('/inventory')}
            />
            <NavButton
              glyph={GLYPHS.gear}
              label={strings.home_nav_settings}
              onPress={() => router.push('/settings')}
            />
          </View>
        </View>
      </TavernFrame>
      <DevTools />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#150d08' },
  stack: { flex: 1, gap: theme.spacing(3) },
  topBarWell: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing(3),
  },
  heartsCol: { gap: theme.spacing(2) },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing(2) },
  streakLabel: { ...theme.type.label, color: theme.colors.textDim },
  streakBar: { width: 96 },
  lvBadge: {
    borderWidth: 2,
    borderColor: tavernColors.goldEdge,
    backgroundColor: '#20130b',
    paddingHorizontal: theme.spacing(3),
    paddingVertical: theme.spacing(2),
  },
  lvText: {
    fontFamily: theme.fontFamily,
    fontSize: 14,
    letterSpacing: 2,
    color: tavernColors.gold,
  },
  bookWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  book: {
    width: '100%',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#20130b',
    borderWidth: 3,
    borderColor: tavernColors.goldEdge,
  },
  bookTitle: {
    fontFamily: theme.fontFamily,
    fontSize: 20,
    letterSpacing: 3,
    color: tavernColors.gold,
    textAlign: 'center',
  },
  pressed: { transform: [{ translateY: 2 }] },
  sleepEdge: {
    borderWidth: 2,
    borderColor: tavernColors.edge,
    backgroundColor: tavernColors.edge,
    position: 'relative',
  },
  sleepBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing(3),
    paddingVertical: theme.spacing(4),
    backgroundColor: tavernColors.gold,
    borderTopWidth: 3,
    borderTopColor: tavernColors.goldLight,
    borderBottomWidth: 3,
    borderBottomColor: tavernColors.goldEdge,
  },
  sleepLabel: {
    fontFamily: theme.fontFamily,
    fontSize: 18,
    letterSpacing: 2,
    color: tavernColors.inkOnParchment,
  },
  navRow: { flexDirection: 'row', gap: theme.spacing(3) },
  navEdge: {
    flex: 1,
    borderWidth: 2,
    borderColor: tavernColors.edge,
    backgroundColor: tavernColors.edge,
    position: 'relative',
  },
  navBody: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing(2),
    paddingVertical: theme.spacing(3),
    backgroundColor: tavernColors.mid,
    borderTopWidth: 3,
    borderTopColor: tavernColors.light,
    borderBottomWidth: 3,
    borderBottomColor: tavernColors.dark,
  },
  navLabel: { ...theme.type.label, color: theme.colors.text },
})
