import React from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { theme } from './theme'

interface Props {
  title?: string
  /** Wrap the body in a vertical ScrollView for long/overflowing content. */
  scroll?: boolean
  children: React.ReactNode
}

/** Base screen: safe area, dark bg, optional gold title with rule. */
export function Screen({ title, scroll = false, children }: Props) {
  const body = title ? (
    <>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.rule} />
      </View>
      {children}
    </>
  ) : (
    children
  )
  return (
    <SafeAreaView style={styles.safe}>
      {scroll ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollBody}
          showsVerticalScrollIndicator={false}
        >
          {body}
        </ScrollView>
      ) : (
        body
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    padding: theme.spacing(4),
    gap: theme.spacing(4),
  },
  scroll: { flex: 1, marginHorizontal: -theme.spacing(4), marginVertical: -theme.spacing(4) },
  scrollBody: {
    padding: theme.spacing(4),
    gap: theme.spacing(4),
    paddingBottom: theme.spacing(8),
  },
  header: {
    alignItems: 'center',
    gap: theme.spacing(2),
  },
  title: {
    ...theme.type.title,
    color: theme.colors.gold,
    textAlign: 'center',
  },
  rule: {
    width: 48,
    height: theme.borderWidth,
    backgroundColor: theme.colors.gold,
  },
})
