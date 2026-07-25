import { useRouter } from 'expo-router'
import React, { createContext, useCallback, useContext, useState } from 'react'
import { Image, StyleSheet, useWindowDimensions } from 'react-native'
import Animated, {
  Easing,
  runOnJS,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'

/**
 * Pixel-art screen transition on the Reanimated UI thread: a cloud curtain
 * slides across, the route swaps underneath, the curtain slides off. Stack
 * native transitions should be `animation: 'none'` so they don't fight this.
 * Usage: const go = useScreenTransition(); go('/chest', { effect: 'wipe' }).
 */
export type TransitionEffect = 'wipe'

export interface TransitionOptions {
  params?: Record<string, string>
  replace?: boolean
  effect?: TransitionEffect
}

type Go = (href: string, options?: TransitionOptions) => void

const TransitionContext = createContext<Go>(() => {})

export function useScreenTransition(): Go {
  return useContext(TransitionContext)
}

// One continuous drift at constant speed: the curtain enters, the route
// swaps the instant the solid zone covers the screen, and it keeps floating
// off without pausing. Both legs travel almost the same distance, so equal
// durations + linear easing give a uniform speed across the whole pass.
const WIPE_LEG_MS = 450

/** Cloud curtain for the wipe transition (local asset, 1536x768 RGBA). */
const CLOUD_CURTAIN = require('../../assets/design/gen/cloud_curtain.png')

export function TransitionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  // 0 left → 1 cover → 2 right; lives on the UI thread so router work can't stall it.
  const wipe = useSharedValue(0)
  const [active, setActive] = useState(false)
  const busyRef = React.useRef(false)

  const finish = useCallback(() => {
    setActive(false)
    busyRef.current = false
    wipe.value = 0
  }, [wipe])

  const go: Go = useCallback(
    (href, options = {}) => {
      const navigate = () => {
        const target = { pathname: href, params: options.params } as never
        if (options.replace) {
          router.replace(target)
        } else {
          router.push(target)
        }
      }
      if (!options.effect || busyRef.current) {
        navigate()
        return
      }
      busyRef.current = true
      setActive(true)
      wipe.value = 0
      wipe.value = withTiming(1, { duration: WIPE_LEG_MS, easing: Easing.linear }, (done) => {
        if (!done) return
        runOnJS(navigate)()
        wipe.value = withTiming(2, { duration: WIPE_LEG_MS, easing: Easing.linear }, (done2) => {
          if (done2) runOnJS(finish)()
        })
      })
    },
    [router, wipe, finish],
  )

  return (
    <TransitionContext.Provider value={go}>
      {children}
      <WipePanel wipe={wipe} active={active} />
    </TransitionContext.Provider>
  )
}

/** The curtain asset is 1536x768; keep its aspect so the feathered flanks
 * are never cropped into hard vertical borders. */
const CURTAIN_ASPECT = 2

function WipePanel({ wipe, active }: { wipe: SharedValue<number>; active: boolean }) {
  const { width, height } = useWindowDimensions()
  const curtainH = height * 1.02
  const curtainW = Math.max(curtainH * CURTAIN_ASPECT, width * 1.75)
  const covered = -(curtainW - width) / 2

  const style = useAnimatedStyle(() => {
    const x =
      wipe.value <= 1
        ? -curtainW + (covered - -curtainW) * wipe.value
        : covered + (width - covered) * (wipe.value - 1)
    return { transform: [{ translateX: x }] }
  }, [curtainW, covered, width])

  return (
    <Animated.View
      style={[
        styles.panel,
        {
          width: curtainW,
          height: curtainH,
          top: -(curtainH - height) / 2,
          opacity: active ? 1 : 0,
        },
        style,
      ]}
      pointerEvents={active ? 'auto' : 'none'}
    >
      <Image
        source={CLOUD_CURTAIN}
        resizeMode="stretch"
        style={{ width: curtainW, height: curtainH }}
      />
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    left: 0,
  },
})
