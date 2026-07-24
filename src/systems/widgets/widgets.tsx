/**
 * Android home-screen widget layouts, in the app's cozy-tavern palette:
 * - SleepStats (2x2): level banner, sleep streak with moon, hero sprite and
 *   the LIVES heart bar — the home screen's TopBar + hero, condensed.
 * - SleepToggle (2x1): night half starts sleep, sun half wakes up, split by
 *   an armor crest. Taps fire eightbitsleep:// deep links (OPEN_URI), the app
 *   router performs the check-in (single-writer store stays safe).
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

const FONT = 'PressStart2P-Regular' // copied to assets/fonts by the config plugin
const SLEEP_URI = 'eightbitsleep://widget-action?action=sleep'
const WAKE_URI = 'eightbitsleep://widget-action?action=wake'

const C = {
  bg: '#221812', // theme bg, deep espresso
  panel: '#3a2a1c', // warm wood panel
  inset: '#2c2016', // sunken well
  outline: '#5c4328', // brass bevel
  text: '#f5e6c8', // parchment cream
  textDim: '#c2a176', // muted tan
  gold: '#eab54d', // honey gold
  night: '#16213c', // night-sky navy (widget scene)
  dayText: '#3a2a1c',
} as const

const MOON = require('../../../assets/pixellab/atmo/moon_night.png')
const SUN = require('../../../assets/pixellab/atmo/sun_day.png')
const HEART_FULL = require('../../../assets/pixellab/icons/heart_full.png')
const HEART_EMPTY = require('../../../assets/pixellab/icons/heart_empty.png')

/** 2x2: LEVEL + SLEEP STREAK header, hero sprite, LIVES heart bar. */
export function SleepStatsWidget({ data }: { data: HomeWidgetData }) {
  if (!data.onboarded || !data.heroType) {
    return (
      <FlexWidget style={styles.root} clickAction="OPEN_APP">
        <FlexWidget style={styles.emptyBox}>
          <TextWidget text="8BIT SLEEP" style={styles.statBig} />
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
            <ImageWidget image={MOON} imageWidth={16} imageHeight={16} />
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

/** 2x1: one state-aware button — moon "START SLEEP" while awake, sun
 *  "WAKE UP" once the hero is tucked in. The tap deep-links the matching
 *  check-in, the store subscription re-renders the widget into the new state. */
export function SleepToggleWidget({ data }: { data: HomeWidgetData }) {
  const asleep = data.asleep
  const backgroundColor = asleep ? C.gold : C.night
  const color = asleep ? C.dayText : C.gold
  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: asleep ? WAKE_URI : SLEEP_URI }}
      style={{ ...styles.toggleRoot, backgroundColor }}
    >
      <ImageWidget image={asleep ? SUN : MOON} imageWidth={24} imageHeight={24} />
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
  label: { color: C.text, fontFamily: FONT, fontSize: 8 },
  labelDim: { color: C.textDim, fontFamily: FONT, fontSize: 8 },
  toggleRoot: {
    width: 'match_parent',
    height: 'match_parent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexGap: 10,
    borderRadius: 16,
    overflow: 'hidden',
  },
  toggleLabel: { fontFamily: FONT, fontSize: 12 },
} as const
