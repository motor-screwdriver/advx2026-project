import { useRouter } from 'expo-router'
import React, { createContext, useCallback, useContext, useRef, useState } from 'react'
import { Animated, Easing, Image, StyleSheet, useWindowDimensions } from 'react-native'

/**
 * Pixel-art screen transition (native driver only): a dark panel slides
 * across, the route swaps underneath, the panel slides off. Used for both
 * menu navigation and ritual beats (morning, death, chest).
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
  const wipe = useRef(new Animated.Value(0)).current // 0 left, 1 cover, 2 right
  const [active, setActive] = useState(false)
  const busy = useRef(false)

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
      if (!options.effect || busy.current) {
        navigate()
        return
      }
      busy.current = true
      setActive(true)
      Animated.timing(wipe, {
        toValue: 1,
        duration: WIPE_LEG_MS,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(() => {
        // Swap the route under the cover and keep moving right away.
        navigate()
        Animated.timing(wipe, {
          toValue: 2,
          duration: WIPE_LEG_MS,
          easing: Easing.linear,
          useNativeDriver: true,
        }).start(() => {
          setActive(false)
          busy.current = false
          wipe.setValue(0)
        })
      })
    },
    [router, wipe],
  )

  return (
    <TransitionContext.Provider value={go}>
      {children}
      {active && <WipePanel wipe={wipe} />}
    </TransitionContext.Provider>
  )
}

/** The curtain asset is 1536x768; keep its aspect so the feathered flanks
 * are never cropped into hard vertical borders. */
const CURTAIN_ASPECT = 2

function WipePanel({ wipe }: { wipe: Animated.Value }) {
  const { width, height } = useWindowDimensions()
  // Full-height curtain sized by the image aspect: on portrait screens this
  // makes it much wider than the screen, so the middle solid-cloud zone (60%)
  // covers the UI while the transparent puffy edges drift across visibly.
  const curtainH = height * 1.02
  const curtainW = Math.max(curtainH * CURTAIN_ASPECT, width * 1.75)
  // center the solid zone over the screen at the covered keyframe
  const covered = -(curtainW - width) / 2
  const wipeX = wipe.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [-curtainW, covered, width],
  })
  return (
    <Animated.View
      style={[
        styles.panel,
        {
          width: curtainW,
          height: curtainH,
          top: -(curtainH - height) / 2,
          transform: [{ translateX: wipeX }],
        },
      ]}
      pointerEvents="auto"
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
