import React, { useEffect } from 'react'
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { playSfx } from '../systems/audio'
import { SFX_TRACKS } from '../systems/audioTracks'
import { useScreenTransition } from '../ui/screenTransition'
import { strings } from '../ui/strings'
import { TavernFrame, WoodButton } from '../ui/tavern'
import { theme } from '../ui/theme'
import { useGame } from '../ui/useGame'
import { DeathSheet } from './DeathSheet'

/** Empty state: no hero to mourn, just a way back. */
function NoHeroScreen({ onBack }: { onBack: () => void }) {
  return (
    <SafeAreaView style={styles.safe}>
      <TavernFrame>
        <View style={styles.fallback}>
          <Text style={styles.hint}>{strings.death_title}</Text>
          <WoodButton label={strings.common_back} onPress={onBack} />
        </View>
      </TavernFrame>
    </SafeAreaView>
  )
}

/**
 * Death — a 1:1 rendition of the top.png mockup: the whole sheet (title,
 * graveyard, "0 HP" panel, both plates) is the sprite itself; only the
 * SOUL TETHER / LET GO hotspots and the moon glow are dynamic.
 *
 * The gold plate runs the phoenix feather when one is held, otherwise a
 * soul-tether resurrection — always available on death.
 */
export function DeathScreen() {
  const go = useScreenTransition()
  const { state, startNewHero, usePhoenix: activatePhoenix } = useGame()
  const { width, height } = useWindowDimensions()
  // Fit the whole 9:16 sheet on screen so LET GO is always visible.
  const sheetWidth = Math.min(width, (height * 9) / 16)
  const hero = state.hero
  const hasFeather = state.artifacts.indexOf('phoenix_feather') >= 0

  useEffect(() => {
    playSfx(SFX_TRACKS.DEATH)
  }, [])

  if (!hero) {
    return <NoHeroScreen onBack={() => go.dismissTo('/')} />
  }

  const onTether = () => {
    if (hasFeather) {
      activatePhoenix()
      go.dismissTo('/')
    } else {
      go('/resurrection')
    }
  }

  const onLetGo = () => {
    startNewHero()
    go.dismissTo('/hero-ceremony')
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.center}>
        <DeathSheet
          width={sheetWidth}
          tetherLabel={hasFeather ? strings.phoenix_offer : strings.death_soul_tether}
          onTether={onTether}
          onLetGo={onLetGo}
        />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#150d08' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hint: {
    ...theme.type.label,
    color: theme.colors.textDim,
    textAlign: 'center',
  },
  fallback: { flex: 1, justifyContent: 'center', gap: theme.spacing(4) },
})
