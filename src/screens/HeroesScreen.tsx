import React from 'react'
import { StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import type { HeroType } from '../contracts/types'
import { strings } from '../ui/strings'
import { ScreenTitle, TavernFrame, tavernLayout } from '../ui/tavern'
import { useGame } from '../ui/useGame'
import { HeroCard, NavBar } from './HeroesParts'

interface RowSpec {
  label: string
  heroes: { type: HeroType; condition: string }[]
}

/** Mirrors the 3×3 summoning grid (engine/hero.ts), bedtime rows × duration. */
const ROWS: RowSpec[] = [
  {
    label: strings.heroes_early,
    heroes: [
      { type: 'monk', condition: strings.heroes_dur_short },
      { type: 'ranger', condition: strings.heroes_dur_mid },
      { type: 'druid', condition: strings.heroes_dur_long },
    ],
  },
  {
    label: strings.heroes_normal,
    heroes: [
      { type: 'rogue', condition: strings.heroes_dur_short },
      { type: 'knight', condition: strings.heroes_dur_mid },
      { type: 'paladin', condition: strings.heroes_dur_long },
    ],
  },
  {
    label: strings.heroes_late,
    heroes: [
      { type: 'ninja', condition: strings.heroes_dur_short },
      { type: 'mage', condition: strings.heroes_dur_mid },
      { type: 'warlock', condition: strings.heroes_dur_long },
    ],
  },
]

export function HeroesScreen() {
  const { state } = useGame()
  const current = state.hero?.type ?? null
  return (
    <SafeAreaView style={styles.safe}>
      <TavernFrame>
        <ScreenTitle
          title={strings.heroes_title.toUpperCase()}
          subtitle={strings.heroes_intro}
          size={20}
        />
        <View style={styles.grid}>
          {ROWS.map((row) => (
            <View key={row.label} style={styles.gridRow}>
              {row.heroes.map((hero) => (
                <HeroCard
                  key={hero.type}
                  type={hero.type}
                  condition={hero.condition}
                  isCurrent={hero.type === current}
                />
              ))}
            </View>
          ))}
        </View>
        <NavBar />
      </TavernFrame>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#150d08' },
  grid: {
    flex: 1,
    justifyContent: 'space-evenly',
    gap: tavernLayout.sectionGap,
    paddingVertical: tavernLayout.sectionGap,
  },
  gridRow: {
    flexDirection: 'row',
    gap: tavernLayout.buttonGap,
  },
})
