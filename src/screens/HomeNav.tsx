import React from 'react'
import { StyleSheet, View } from 'react-native'

import { FloatingButton } from '../ui/FloatingButton'
import { useScreenTransition } from '../ui/screenTransition'
import { theme } from '../ui/theme'

const BUTTONS = [
  { label: '≡', href: '/journal', delay: 110 },
  { label: '?', href: '/guide', delay: 330 },
] as const

/** Journal + guide shortcuts, shown in the home top bar next to the streak. */
export function HomeNav() {
  const go = useScreenTransition()
  return (
    <View style={styles.row}>
      {BUTTONS.map(({ label, href, delay }) => (
        <FloatingButton
          key={href}
          variant="round"
          scale={1}
          delay={delay}
          label={label}
          onPress={() => go(href, { effect: 'wipe' })}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: theme.spacing(2) },
})
