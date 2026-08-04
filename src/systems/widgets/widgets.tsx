/**
 * Android home-screen widget layouts, in the app's cozy-tavern palette:
 * - SleepStats (2x2): level banner, sleep streak with moon, hero sprite and
 *   the LIVES heart bar — the home screen's TopBar + hero, condensed.
 * - SleepToggle (2x1): one state-aware button — moon "START SLEEP" while
 *   awake, sun "WAKE UP" once tucked in. The tap fires a WIDGET_CLICK handled
 *   headlessly by ./register (the store toggles in place, no app launch).
 * Loaded only on Android native builds via ./register / ./render — importing
 * react-native-android-widget in Expo Go / web / jest crashes on the missing
 * native module. RemoteViews render system frames: no RN gap, no RN fonts
 * (the TTF is bundled by the config plugin's `fonts` option).
 */
import React from 'react'
import { FlexWidget, ImageWidget, TextWidget } from 'react-native-android-widget'

import { HERO_IMAGES } from './heroImages'
import type { HomeWidgetData } from './widgetData'

export const WIDGET_NAMES = { stats: 'SleepStats', toggle: 'SleepToggle' } as const

/** Custom click action: routed to the headless task handler as WIDGET_CLICK. */
export const TOGGLE_SLEEP_ACTION = 'TOGGLE_SLEEP'

const FONT = 'PressStart2P-Regular' // copied to assets/fonts by the config plugin

const C = {
  bg: '#221812', // theme bg, deep espresso
  panel: '#3a2a1c', // warm wood panel
  inset: '#2c2016', // sunken well
  outline: '#5c4328', // brass bevel
  text: '#f5e6c8', // parchment cream
  textDim: '#c2a176', // muted tan
  gold: '#eab54d', // honey gold
  goldLight: '#f7d98b', // top bevel highlight on the gold button
  goldDark: '#8a6b2d', // thick base edge of the gold button
  bevelDark: '#120c08', // thick base edge of the brown button
  dayText: '#3a2a1c',
} as const

const HEART_FULL = require('../../../assets/pixellab/icons/heart_full.png')
const HEART_EMPTY = require('../../../assets/pixellab/icons/heart_empty.png')

/** 2x2: LEVEL + SLEEP STREAK header, hero sprite, LIVES heart bar. */
export function SleepStatsWidget({ data }: { data: HomeWidgetData }) {
  if (!data.onboarded || !data.heroType) {
    return (
      <FlexWidget style={styles.root} clickAction="OPEN_APP">
        <FlexWidget style={styles.emptyBox}>
          {/* Stacked, not one line: the title does not fit a 2x2 cell at the
              stat size, and widget text has no auto-shrink to fall back on.
              Own box so the empty state's gap does not split the wordmark. */}
          <FlexWidget style={styles.wordmarkBox}>
            <TextWidget text="THE SLEEPY" style={styles.wordmark} />
            <TextWidget text="KNIGHT" style={styles.wordmark} />
          </FlexWidget>
          <TextWidget text="Summon your hero" style={styles.labelDim} />
        </FlexWidget>
      </FlexWidget>
    )
  }
  const hero = HERO_IMAGES[data.heroType]
  return (
    <FlexWidget style={styles.root} clickAction="OPEN_APP">
      <FlexWidget style={styles.headerRow}>
        <FlexWidget style={styles.banner}>
          <TextWidget text="LEVEL" style={styles.label} />
          <TextWidget text={String(data.level)} style={styles.statBig} />
        </FlexWidget>
        <FlexWidget style={styles.streakBox}>
          <FlexWidget style={styles.streakTitle}>
            <TextWidget text="SLEEP STREAK" style={styles.label} />
          </FlexWidget>
          <TextWidget text={String(data.sleepStreak)} style={styles.statBig} />
          <TextWidget text="NIGHTS" style={styles.labelDim} />
        </FlexWidget>
      </FlexWidget>
      <FlexWidget style={styles.heroWrap}>
        <ImageWidget image={data.gold ? hero.gold : hero.normal} imageWidth={92} imageHeight={92} />
      </FlexWidget>
      <FlexWidget style={styles.livesPanel}>
        <TextWidget text="LIVES" style={styles.label} />
        <FlexWidget style={styles.heartsRow}>
          {Array.from({ length: data.maxHp }, (_, i) => (
            <ImageWidget
              key={i}
              image={i < data.hp ? HEART_FULL : HEART_EMPTY}
              imageWidth={18}
              imageHeight={18}
            />
          ))}
        </FlexWidget>
        <TextWidget text={`${data.hp} / ${data.maxHp}`} style={styles.labelDim} />
      </FlexWidget>
    </FlexWidget>
  )
}

/** 2x1: one state-aware button styled as a chunky physical key — light top
 *  bevel, thick dark base edge, like PixelButton in the app. Brown "START
 *  SLEEP" while awake, gold "WAKE UP" once tucked in. The tap stays on the
 *  home screen: the headless task handler flips the store and re-renders. */
export function SleepToggleWidget({ data }: { data: HomeWidgetData }) {
  const asleep = data.asleep
  const face = {
    backgroundColor: asleep ? C.gold : C.bg,
    borderColor: asleep ? C.goldDark : C.bevelDark,
    borderTopColor: asleep ? C.goldLight : C.outline,
  }
  const color = asleep ? C.dayText : C.gold
  return (
    <FlexWidget
      clickAction={TOGGLE_SLEEP_ACTION}
      clickActionData={{ action: asleep ? 'wake' : 'sleep' }}
      style={{ ...styles.toggleRoot, ...face }}
    >
      <TextWidget
        text={asleep ? 'WAKE UP' : 'START SLEEP'}
        style={{ ...styles.toggleLabel, color }}
      />
    </FlexWidget>
  )
}

const styles = {
  root: {
    width: 'match_parent',
    height: 'match_parent',
    flexDirection: 'column',
    backgroundColor: C.bg,
    borderRadius: 16,
    padding: 10,
  },
  headerRow: { flexDirection: 'row', width: 'match_parent' },
  banner: {
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.outline,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  streakBox: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakTitle: { flexDirection: 'row', alignItems: 'center', flexGap: 6 },
  heroWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', width: 'match_parent' },
  livesPanel: {
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.outline,
    borderRadius: 8,
    paddingVertical: 6,
    width: 'match_parent',
    flexGap: 4,
  },
  heartsRow: { flexDirection: 'row', justifyContent: 'center', flexGap: 4 },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', flexGap: 8 },
  statBig: { color: C.gold, fontFamily: FONT, fontSize: 22 },
  wordmarkBox: { alignItems: 'center' },
  wordmark: { color: C.gold, fontFamily: FONT, fontSize: 12 },
  label: { color: C.text, fontFamily: FONT, fontSize: 8 },
  labelDim: { color: C.textDim, fontFamily: FONT, fontSize: 8 },
  toggleRoot: {
    width: 'match_parent',
    height: 'match_parent',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderBottomWidth: 6, // thick base edge — the button reads as raised
    paddingBottom: 6, // recenters the label on the face above the base edge
    borderRadius: 16,
    overflow: 'hidden',
  },
  toggleLabel: { fontFamily: FONT, fontSize: 12, textAlign: 'center', lineHeight: 20 },
} as const
