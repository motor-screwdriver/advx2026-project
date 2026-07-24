import React from 'react'
import { StyleSheet, Text } from 'react-native'

import { PixelPanel } from '../ui/PixelPanel'
import { Screen } from '../ui/Screen'
import { strings } from '../ui/strings'
import { theme } from '../ui/theme'
import { useGame } from '../ui/useGame'
import { formatClock, formatDuration } from '../ui/window'

/**
 * "How it works" memo: the sleep window, the scoring rules and the reminder
 * schedule — the stuff that used to be invisible to the user. Opened from the
 * "?" button on the home top bar.
 */
export function GuideScreen() {
  const { state } = useGame()
  const window = state.window
  return (
    <Screen title={strings.guide_title} scroll>
      <PixelPanel>
        <Text style={styles.heading}>{strings.guide_window_title}</Text>
        <Text style={styles.value}>
          {window
            ? `${formatClock(window.bedMin)} - ${formatClock(window.wakeMin)} · ${formatDuration(window.wakeMin - window.bedMin)}`
            : '-'}
        </Text>
        <Text style={styles.dim}>{strings.guide_window_body}</Text>
      </PixelPanel>
      <PixelPanel>
        <Text style={styles.heading}>{strings.guide_scoring_title}</Text>
        <Text style={styles.value}>{strings.guide_scoring_start}</Text>
        <Text style={styles.dim}>{strings.guide_scoring_penalties}</Text>
        <Text style={styles.dim}>{strings.guide_scoring_bands}</Text>
        <Text style={styles.dim}>{strings.guide_scoring_streak}</Text>
      </PixelPanel>
      <PixelPanel>
        <Text style={styles.heading}>{strings.guide_reminders_title}</Text>
        <Text style={styles.dim}>{strings.guide_reminders_body}</Text>
      </PixelPanel>
    </Screen>
  )
}

const styles = StyleSheet.create({
  heading: {
    ...theme.type.label,
    color: theme.colors.gold,
    textTransform: 'uppercase',
  },
  value: {
    ...theme.type.body,
    color: theme.colors.text,
  },
  dim: {
    ...theme.type.label,
    color: theme.colors.textDim,
    textTransform: 'none',
  },
})
