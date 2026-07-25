import React, { useRef, useState } from 'react'
import {
  Image,
  type LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useScreenTransition } from '../ui/screenTransition'
import { strings } from '../ui/strings'
import { theme } from '../ui/theme'

// Each step is a full pre-rendered screen (frame, dots, plaque, SKIP baked in);
// only the parchment body text and the interactive buttons are layered on top.
const STEPS = [
  { img: require('../../assets/design/tutorial/step1.png'), body: strings.tutorial_card1_body },
  { img: require('../../assets/design/tutorial/step2.png'), body: strings.tutorial_card2_body },
  { img: require('../../assets/design/tutorial/step3.png'), body: strings.tutorial_card3_body },
] as const

const BTN = {
  next: require('../../assets/design/tutorial/btn_next.png'),
  nextPressed: require('../../assets/design/tutorial/btn_next_pressed.png'),
  skip: require('../../assets/design/tutorial/btn_skip.png'),
  skipPressed: require('../../assets/design/tutorial/btn_skip_pressed.png'),
} as const

const RATIO = 2160 / 3840 // 9:16 render

/** Largest 9:16 box that fits in the available space, so overlay %s stay exact. */
function fitStage(w: number, h: number) {
  const width = w / h < RATIO ? w : h * RATIO
  return { width, height: width / RATIO }
}

export function TutorialScreen() {
  const go = useScreenTransition()
  const scroller = useRef<ScrollView>(null)
  const [stage, setStage] = useState<{ width: number; height: number } | null>(null)
  const finish = () => go('/', { replace: true })

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout
    setStage(fitStage(width, height))
  }

  const goTo = (i: number) =>
    scroller.current?.scrollTo({ x: i * (stage?.width ?? 0), animated: true })

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center} onLayout={onLayout}>
        {stage && (
          <View style={[styles.stage, stage]}>
            <ScrollView
              ref={scroller}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
            >
              {STEPS.map((step, i) => {
                const last = i === STEPS.length - 1
                return (
                  <View key={i} style={{ width: stage.width, height: stage.height }}>
                    <Image source={step.img} style={styles.image} />
                    <View style={styles.parchment} pointerEvents="none">
                      <Text style={styles.parchmentText}>{step.body}</Text>
                    </View>
                    {last ? (
                      // No GOT IT sprite — tap the baked plaque straight through.
                      <Pressable style={styles.nextBtn} onPress={finish} />
                    ) : (
                      <SpriteButton
                        style={styles.nextBtn}
                        idle={BTN.next}
                        pressed={BTN.nextPressed}
                        onPress={() => goTo(i + 1)}
                      />
                    )}
                    <SpriteButton
                      style={styles.skipBtn}
                      idle={BTN.skip}
                      pressed={BTN.skipPressed}
                      onPress={finish}
                    />
                  </View>
                )
              })}
            </ScrollView>
          </View>
        )}
      </View>
    </SafeAreaView>
  )
}

/** Absolutely-placed button whose sprite swaps to the pressed frame while held. */
function SpriteButton(props: {
  style: object
  idle: number
  pressed: number
  onPress: () => void
}) {
  return (
    <Pressable style={props.style} onPress={props.onPress}>
      {({ pressed }) => (
        <Image source={pressed ? props.pressed : props.idle} style={styles.image} />
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0d0805' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  stage: { position: 'relative' },
  // Box aspect matches the source, so a plain fill renders undistorted (web
  // ignores resizeMode="contain" here, hence exact-ratio boxes throughout).
  image: { width: '100%', height: '100%' },
  // Blank parchment sits mid-screen in the artwork; ink the body onto it.
  parchment: {
    position: 'absolute',
    left: '18%',
    right: '18%',
    top: '56%',
    bottom: '29%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  parchmentText: {
    ...theme.type.body,
    fontSize: 12,
    lineHeight: 18,
    color: '#3a2712',
    textAlign: 'center',
  },
  // Fractions + aspectRatio map onto the baked plaque / caption (2160×3840).
  nextBtn: {
    position: 'absolute',
    left: '15%',
    width: '70%',
    top: '84.7%',
    aspectRatio: 1527 / 366,
  },
  skipBtn: {
    position: 'absolute',
    left: '42%',
    width: '16%',
    top: '95.7%',
    aspectRatio: 317 / 107,
  },
})
