import React from 'react'
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native'

import { theme } from './theme'

/**
 * Tavern UI kit — base primitives (see tavern.tsx for the barrel export):
 * colors, rivets/ornaments, TavernFrame, ScreenTitle, WoodPanel, Parchment.
 */

const wood = {
  edge: '#1c110a', // darkest outer edge of frames
  dark: '#33200f', // deep wood
  mid: '#4d3018', // main wood
  light: '#6b4423', // top bevel
  rivet: '#d9a24a', // brass rivets / ornaments
  gold: '#efb33f', // button / title gold
  goldEdge: '#9c6a1c', // gold lower bevel
  goldLight: '#ffd970', // gold top bevel / bright text
  parchment: '#e9d6ac',
  parchmentEdge: '#7a5a30',
  inkOnParchment: '#2c1d0f',
  danger: '#d4483c',
} as const

export const tavernColors = wood

/**
 * Shared layout rhythm for every screen. TavernFrame already insets content
 * (8 outer + 2 border + screenPad inner on each side), so screens add NO
 * extra horizontal padding/margin on top-level panels and buttons; stacked
 * panels/buttons sit sectionGap apart, sibling buttons in a row buttonGap.
 */
export const tavernLayout = {
  /** Inner content inset TavernFrame provides (theme.spacing(3) = 12). */
  screenPad: theme.spacing(3),
  /** Total inset from the screen edge inside TavernFrame (8 outer + 2 border
   * + 12 inner = 22). Screens without a TavernFrame use this so blocks and
   * buttons sit at the same distance from the screen edge everywhere. */
  edgePad: theme.spacing(2) + 2 + theme.spacing(3),
  /** Vertical gap between stacked panels and bottom action buttons. */
  sectionGap: theme.spacing(3),
  /** Gap between sibling buttons/badges in a row. */
  buttonGap: theme.spacing(3),
} as const

function Rivet({ size = 5 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, backgroundColor: wood.rivet, borderRadius: 1 }} />
  )
}

/** Four brass rivets pinned to the corners of the parent (position: relative). */
export function CornerRivets({ size = 5, inset = 4 }: { size?: number; inset?: number }) {
  return (
    <>
      <View style={[styles.rivet, { top: inset, left: inset }]}>
        <Rivet size={size} />
      </View>
      <View style={[styles.rivet, { top: inset, right: inset }]}>
        <Rivet size={size} />
      </View>
      <View style={[styles.rivet, { bottom: inset, left: inset }]}>
        <Rivet size={size} />
      </View>
      <View style={[styles.rivet, { bottom: inset, right: inset }]}>
        <Rivet size={size} />
      </View>
    </>
  )
}

function Ornament({ color = wood.rivet, size = 6 }: { color?: string; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        transform: [{ rotate: '45deg' }],
      }}
    />
  )
}

/** Full-screen root: deep tavern background with a thin framed border. */
export function TavernFrame({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.frame}>
      <View style={styles.frameInner}>{children}</View>
    </View>
  )
}

/** Gold pixel title with diamond ornaments, e.g. "SETTINGS", "BAG". */
export function ScreenTitle({
  title,
  subtitle,
  size = 22,
}: {
  title: string
  subtitle?: string
  size?: number
}) {
  return (
    <View style={styles.titleWrap}>
      <View style={styles.titleRow}>
        <Ornament />
        <Text style={[styles.title, { fontSize: size, lineHeight: size * 1.5 }]}>{title}</Text>
        <Ornament />
      </View>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  )
}

/** Wood-framed panel with brass rivets and a sunken dark content well. */
export function WoodPanel({
  children,
  style,
  contentStyle,
  rivets = true,
  fill = false,
}: {
  children: React.ReactNode
  style?: StyleProp<ViewStyle>
  contentStyle?: StyleProp<ViewStyle>
  rivets?: boolean
  /** Stretch the bevel + well to fill a flex parent (e.g. full-height cards). */
  fill?: boolean
}) {
  return (
    <View style={[styles.woodOuter, style]}>
      <View style={[styles.woodBevel, fill && styles.fill]}>
        <View style={[styles.woodWell, fill && styles.fill, contentStyle]}>{children}</View>
      </View>
      {rivets ? <CornerRivets /> : null}
    </View>
  )
}

/** Cream parchment inset — dialogue text, rule lists, captions. */
export function Parchment({
  children,
  style,
}: {
  children: React.ReactNode
  style?: StyleProp<ViewStyle>
}) {
  return (
    <View style={[styles.parchment, style]}>
      <View style={styles.parchmentInner}>{children}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  frame: {
    flex: 1,
    backgroundColor: '#150d08',
    padding: theme.spacing(2),
  },
  frameInner: {
    flex: 1,
    borderWidth: 2,
    borderColor: wood.dark,
    backgroundColor: theme.colors.bg,
    padding: tavernLayout.screenPad,
  },
  titleWrap: { alignItems: 'center', gap: theme.spacing(2) },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing(3) },
  title: {
    fontFamily: theme.fontFamily,
    color: wood.gold,
    letterSpacing: 2,
    textAlign: 'center',
  },
  subtitle: {
    ...theme.type.label,
    color: theme.colors.textDim,
    textAlign: 'center',
  },
  woodOuter: {
    backgroundColor: wood.edge,
    borderWidth: 2,
    borderColor: wood.edge,
    position: 'relative',
  },
  woodBevel: {
    borderTopWidth: 2,
    borderTopColor: wood.light,
    borderBottomWidth: 2,
    borderBottomColor: wood.dark,
    backgroundColor: wood.mid,
    padding: theme.spacing(1.5),
  },
  woodWell: {
    backgroundColor: '#20130b',
    padding: theme.spacing(3),
  },
  fill: { flex: 1 },
  parchment: {
    backgroundColor: wood.parchmentEdge,
    padding: 2,
  },
  parchmentInner: {
    backgroundColor: wood.parchment,
    padding: theme.spacing(3),
  },
  rivet: { position: 'absolute' },
})
