import React, { useEffect, useRef, useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'

import { DESIGN, type SpriteEntry } from '../../assets/manifest'
import { PixelSprite } from '../ui/PixelSprite'
import { theme } from '../ui/theme'
import { formatClock } from '../ui/window'

// Geometry of the picker window sprite (282x364): the dark opening the digits
// scroll through, as fractions of the sprite size. Measured on
// 12-picker-window-bedtime.png / 13-picker-window-wakeup.png.
const WINDOW_ASPECT = 364 / 282
const OPENING_X0 = 0.106
const OPENING_X1 = 0.904
const OPENING_Y0 = 0.151
const OPENING_Y1 = 0.893
const VISIBLE_ROWS = 5

// Digit colors from the sprite spec (catalog sheet): bright active / dim inactive.
const DIGIT_ACTIVE = '#F0D28C'
const DIGIT_DIM = '#5A442C'

interface SpriteWheelProps {
  windowSprite: SpriteEntry
  values: readonly number[]
  value: number
  onChange: (value: number) => void
  width: number
}

/**
 * Wheel picker 1:1 with the prototype: the window sprite is the base layer,
 * digits scroll inside its dark opening (clipped by the opening bounds), the
 * selection band with gold side arrows marks the center row.
 */
export function SpriteWheel({ windowSprite, values, value, onChange, width }: SpriteWheelProps) {
  const scrollRef = useRef<ScrollView>(null)
  const [selectedIndex, setSelectedIndex] = useState(() => Math.max(0, values.indexOf(value)))

  const windowH = width * WINDOW_ASPECT
  const openingW = width * (OPENING_X1 - OPENING_X0)
  const openingH = windowH * (OPENING_Y1 - OPENING_Y0)
  const rowH = openingH / VISIBLE_ROWS

  useEffect(() => {
    const index = Math.max(0, values.indexOf(value))
    setSelectedIndex(index)
    scrollRef.current?.scrollTo({ y: index * rowH, animated: false })
  }, [values, value, rowH])

  const commit = (offsetY: number) => {
    const index = Math.min(Math.max(0, Math.round(offsetY / rowH)), values.length - 1)
    setSelectedIndex(index)
    onChange(values[index])
  }

  return (
    <View style={{ width, height: windowH }}>
      <PixelSprite sprite={windowSprite} size={width} />
      <View
        style={[
          styles.opening,
          {
            left: width * OPENING_X0,
            top: windowH * OPENING_Y0,
            width: openingW,
            height: openingH,
          },
        ]}
      >
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          snapToInterval={rowH}
          decelerationRate="fast"
          contentContainerStyle={{ paddingVertical: rowH * 2 }}
          onScroll={(event) =>
            setSelectedIndex(Math.round(event.nativeEvent.contentOffset.y / rowH))
          }
          scrollEventThrottle={16}
          onMomentumScrollEnd={(event) => commit(event.nativeEvent.contentOffset.y)}
        >
          {values.map((item, index) => (
            <WheelDigit key={item} item={item} selected={index === selectedIndex} rowH={rowH} />
          ))}
        </ScrollView>
        <SelectionBand rowH={rowH} openingW={openingW} />
      </View>
    </View>
  )
}

function WheelDigit({ item, selected, rowH }: { item: number; selected: boolean; rowH: number }) {
  return (
    <View style={[styles.digitCell, { height: rowH }]}>
      <Text
        style={[
          styles.digit,
          { fontSize: rowH * 0.36, color: DIGIT_DIM },
          selected && { fontSize: rowH * 0.72, color: DIGIT_ACTIVE },
        ]}
      >
        {formatClock(item)}
      </Text>
    </View>
  )
}

function SelectionBand({ rowH, openingW }: { rowH: number; openingW: number }) {
  const arrowH = rowH * 0.42
  const arrowW = arrowH * (32 / 40)
  return (
    <View
      pointerEvents="none"
      style={[styles.selectionBand, { top: rowH * 2, height: rowH, width: openingW }]}
    >
      <PixelSprite
        sprite={DESIGN.onboarding_selection_arrow}
        size={arrowW}
        style={{ height: arrowH }}
      />
      <PixelSprite
        sprite={DESIGN.onboarding_selection_arrow}
        size={arrowW}
        style={{ height: arrowH, transform: [{ scaleX: -1 }] }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  opening: {
    position: 'absolute',
    overflow: 'hidden',
  },
  digitCell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  digit: {
    ...theme.type.body,
    textAlign: 'center',
  },
  selectionBand: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#4a3520',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    paddingHorizontal: 2,
  },
})
