import { useRouter } from 'expo-router'
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
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
 * Cloud-curtain screen transitions (Reanimated UI thread). Stack should use
 * `animation: 'none'` so it doesn't fight the wipe.
 * Usage: const go = useScreenTransition(); go('/chest'); go.back(); go.dismissTo('/')
 */
export type TransitionEffect = 'wipe' | 'none'

export interface TransitionOptions {
  params?: Record<string, string>
  replace?: boolean
  /** Default `wipe`. Pass `none` only for rare no-animation jumps. */
  effect?: TransitionEffect
}

export type ScreenNav = ((href: string, options?: TransitionOptions) => void) & {
  back: (options?: Pick<TransitionOptions, 'effect'>) => void
  dismissTo: (href: string, options?: Pick<TransitionOptions, 'effect'>) => void
}

const TransitionContext = createContext<ScreenNav>(noopNav())

/** Module bridge so non-React systems (demo, wake reminder) get the same clouds. */
let bridge: ScreenNav = noopNav()

export function useScreenTransition(): ScreenNav {
  return useContext(TransitionContext)
}

/** Same API as the hook, safe to call outside React after the provider mounts. */
export const cloudGo: ScreenNav = Object.assign(
  ((href: string, options?: TransitionOptions) => bridge(href, options)) as ScreenNav,
  {
    back: (options?: Pick<TransitionOptions, 'effect'>) => bridge.back(options),
    dismissTo: (href: string, options?: Pick<TransitionOptions, 'effect'>) =>
      bridge.dismissTo(href, options),
  },
)

function noopNav(): ScreenNav {
  const go = ((_href: string, _options?: TransitionOptions) => {}) as ScreenNav
  go.back = () => {}
  go.dismissTo = () => {}
  return go
}

const WIPE_LEG_MS = 450
const CLOUD_CURTAIN = require('../../assets/design/gen/cloud_curtain.png')
const CURTAIN_ASPECT = 2

function useCloudNav(wipe: SharedValue<number>, setActive: (v: boolean) => void): ScreenNav {
  const router = useRouter()
  const busyRef = React.useRef(false)

  const finish = useCallback(() => {
    setActive(false)
    busyRef.current = false
    wipe.value = 0
  }, [wipe, setActive])

  const runAfterCover = useCallback(
    (action: () => void, effect: TransitionEffect) => {
      if (effect === 'none' || busyRef.current) {
        action()
        return
      }
      busyRef.current = true
      setActive(true)
      wipe.value = 0
      wipe.value = withTiming(1, { duration: WIPE_LEG_MS, easing: Easing.linear }, (done) => {
        if (!done) return
        runOnJS(action)()
        wipe.value = withTiming(2, { duration: WIPE_LEG_MS, easing: Easing.linear }, (done2) => {
          if (done2) runOnJS(finish)()
        })
      })
    },
    [wipe, finish, setActive],
  )

  return useMemo<ScreenNav>(() => {
    const go = ((href: string, options: TransitionOptions = {}) => {
      const effect = options.effect ?? 'wipe'
      runAfterCover(() => {
        const target = { pathname: href, params: options.params } as never
        if (options.replace) router.replace(target)
        else router.push(target)
      }, effect)
    }) as ScreenNav
    go.back = (options = {}) => runAfterCover(() => router.back(), options.effect ?? 'wipe')
    go.dismissTo = (href, options = {}) =>
      runAfterCover(() => router.dismissTo(href as never), options.effect ?? 'wipe')
    return go
  }, [router, runAfterCover])
}

export function TransitionProvider({ children }: { children: React.ReactNode }) {
  const wipe = useSharedValue(0)
  const [active, setActive] = useState(false)
  const nav = useCloudNav(wipe, setActive)

  useEffect(() => {
    bridge = nav
    return () => {
      bridge = noopNav()
    }
  }, [nav])

  return (
    <TransitionContext.Provider value={nav}>
      {children}
      <WipePanel wipe={wipe} active={active} />
    </TransitionContext.Provider>
  )
}

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
  panel: { position: 'absolute', left: 0 },
})
