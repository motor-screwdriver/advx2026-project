import React, { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'

import { PixelButton } from '../ui/PixelButton'
import { strings } from '../ui/strings'
import { theme } from '../ui/theme'
import { DebugMenu } from './DebugMenu'

/** Dev-only launcher for the other screens; removed before release. */
export function DevTools() {
  const [open, setOpen] = useState(false)
  if (!__DEV__) {
    return null
  }
  return (
    <>
      <Pressable style={styles.devTab} onPress={() => setOpen(true)}>
        <Text style={styles.devText}>DEV</Text>
      </Pressable>
      {open && (
        <View style={styles.devOverlay}>
          <ScrollView contentContainerStyle={styles.devScroll}>
            <DebugMenu />
            <PixelButton label={strings.common_back} onPress={() => setOpen(false)} />
          </ScrollView>
        </View>
      )}
    </>
  )
}

const styles = StyleSheet.create({
  devTab: {
    position: 'absolute',
    top: theme.spacing(20),
    right: theme.spacing(2),
    paddingHorizontal: theme.spacing(2),
    paddingVertical: theme.spacing(1),
    backgroundColor: theme.colors.inset,
    borderWidth: theme.borderWidth,
    borderColor: theme.colors.outline,
    borderRadius: theme.borderRadius,
    opacity: 0.7,
  },
  devText: { ...theme.type.label, color: theme.colors.textDim },
  devOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20, 13, 8, 0.94)',
  },
  devScroll: {
    padding: theme.spacing(4),
    paddingTop: theme.spacing(10),
    gap: theme.spacing(4),
  },
})
