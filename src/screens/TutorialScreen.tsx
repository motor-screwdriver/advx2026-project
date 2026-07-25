import React, { useState } from 'react'
import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import type { SpriteEntry } from '../../assets/manifest'
import { useScreenTransition } from '../ui/screenTransition'
import { strings } from '../ui/strings'
import { CornerRivets, GoldButton, tavernColors, TavernFrame, WoodPanel } from '../ui/tavern'
import { theme } from '../ui/theme'

// New copy for this screen (kept local; strings.ts is owned elsewhere).
const COPY = {
  next: 'NEXT',
  skip: 'SKIP',
} as const

type Art = 'sleep' | 'morning' | 'chest'

// Standalone per-page illustrations (PixelLab, tools/pixellab_gen.py) —
// replacing the old 02-card-illustration slice that rendered an empty well.
const PAGE_ART = {
  sleep: {
    source: require('../../assets/design/gen/tutorial_p1.png'),
    width: 160,
    height: 160,
    frames: 1,
    frameWidth: 160,
    frameHeight: 160,
  },
  morning: {
    source: require('../../assets/design/gen/tutorial_p2.png'),
    width: 160,
    height: 160,
    frames: 1,
    frameWidth: 160,
    frameHeight: 160,
  },
  chest: {
    source: require('../../assets/design/gen/tutorial_p3.png'),
    width: 160,
    height: 160,
    frames: 1,
    frameWidth: 160,
    frameHeight: 160,
  },
} as const satisfies Record<Art, SpriteEntry>

// Open book on a tavern desk (PixelLab, 384×240): dark cover/spine on the
// left, a blank cream page on the right that carries the tutorial text.
const BOOK_PAGE = {
  source: require('../../assets/design/gen/book_page_right_crop.png'),
  width: 244,
  height: 233,
  frames: 1,
  frameWidth: 244,
  frameHeight: 233,
} as const satisfies SpriteEntry

/** One page per rule; the mockup shows page 1 of 3 (11-туториал.png). */
const PAGES: readonly { art: Art; text: string }[] = [
  { art: 'sleep', text: strings.tutorial_card1_body },
  { art: 'morning', text: strings.tutorial_card2_body },
  { art: 'chest', text: strings.tutorial_card3_body },
]

export function TutorialScreen() {
  const go = useScreenTransition()
  const [page, setPage] = useState(0)
  const last = page === PAGES.length - 1
  const close = () => go.dismissTo('/')

  return (
    <SafeAreaView style={styles.safe}>
      <TavernFrame>
        <View style={styles.header}>
          <Text style={styles.headerText} numberOfLines={1}>
            {strings.tutorial_title}
          </Text>
          <Text style={styles.headerText} numberOfLines={1}>
            {page + 1}/{PAGES.length}
          </Text>
        </View>
        <WoodPanel fill style={styles.panel} contentStyle={styles.panelWell}>
          <View style={styles.artFrame}>
            <ArtWell art={PAGES[page].art} />
            <CornerRivets inset={5} />
          </View>
          <BookPage text={PAGES[page].text} />
        </WoodPanel>
        <View style={styles.dots}>
          {PAGES.map((_, index) => (
            <View key={index} style={[styles.dot, index === page && styles.dotActive]} />
          ))}
        </View>
        <GoldButton
          label={last ? strings.tutorial_done : COPY.next}
          onPress={() => (last ? close() : setPage(page + 1))}
        />
        <Pressable onPress={close} hitSlop={8} style={({ pressed }) => pressed && styles.pressed}>
          <Text style={styles.skip}>{COPY.skip}</Text>
        </Pressable>
      </TavernFrame>
    </SafeAreaView>
  )
}

/** Riveted dark well holding the page illustration; fixed height, no flex chains. */
function ArtWell({ art }: { art: Art }) {
  const sprite = PAGE_ART[art]
  return (
    <View style={styles.artWell}>
      <Image source={sprite.source} resizeMode="cover" style={StyleSheet.absoluteFill} />
    </View>
  )
}

/** The tutorial "page": book art with the body text inked on the right page. */
function BookPage({ text }: { text: string }) {
  return (
    <View style={styles.bookFrame}>
      <View style={styles.bookInner}>
        <Image source={BOOK_PAGE.source} resizeMode="cover" style={StyleSheet.absoluteFill} />
        <View style={styles.bookTextArea}>
          <Text style={styles.bookText}>{text}</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#150d08' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing(2),
    paddingHorizontal: theme.spacing(1),
  },
  headerText: {
    ...theme.type.title,
    fontSize: 12,
    lineHeight: 18,
    flexShrink: 1,
    color: tavernColors.gold,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  panel: { flex: 1, marginTop: theme.spacing(2) },
  panelWell: { gap: theme.spacing(3) },
  artFrame: {
    width: '100%',
    height: 300,
    backgroundColor: tavernColors.edge,
    borderWidth: 2,
    borderColor: tavernColors.dark,
    padding: theme.spacing(1.5),
    position: 'relative',
    overflow: 'hidden',
  },
  artWell: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    backgroundColor: '#180e07',
    position: 'relative',
  },
  bookFrame: {
    width: '100%',
    height: 240,
    borderWidth: 2,
    borderColor: tavernColors.dark,
    backgroundColor: tavernColors.edge,
    alignItems: 'center',
    overflow: 'hidden',
  },
  bookInner: {
    width: 251, // 240 * 244/233 — exact book image aspect, so the text map holds
    height: 240,
    position: 'relative',
  },
  bookTextArea: {
    position: 'absolute',
    left: '30%',
    right: '9%',
    top: '15%',
    bottom: '25%',
    justifyContent: 'center',
  },
  bookText: {
    ...theme.type.body,
    fontSize: 10,
    lineHeight: 16,
    color: '#2c1d0f',
    textAlign: 'left',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing(3),
    paddingVertical: theme.spacing(3),
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: tavernColors.mid,
    backgroundColor: tavernColors.edge,
  },
  dotActive: {
    borderColor: tavernColors.goldLight,
    backgroundColor: tavernColors.gold,
  },
  skip: {
    ...theme.type.label,
    color: theme.colors.textDim,
    textAlign: 'center',
    letterSpacing: 2,
    paddingVertical: theme.spacing(2),
  },
  pressed: { opacity: 0.6 },
})
