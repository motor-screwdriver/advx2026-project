import { useEffect, useState } from 'react'
import { AppState } from 'react-native'

import { useGameStore } from '../state/store'
import { playMusic } from './audio'
import { chooseMusicTrack, msUntilNextThemeBoundary } from './audioThemeLogic'

export function AudioThemeController() {
  const pendingBedTime = useGameStore((s) => s.pendingBedTime)
  const [clockTick, setClockTick] = useState(0)

  useEffect(() => {
    playMusic(chooseMusicTrack(pendingBedTime))
  }, [pendingBedTime, clockTick])

  useEffect(() => {
    const timer = setTimeout(() => setClockTick((tick) => tick + 1), msUntilNextThemeBoundary())
    return () => clearTimeout(timer)
  }, [clockTick])

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (status) => {
      if (status === 'active') {
        setClockTick((tick) => tick + 1)
      }
    })
    return () => subscription.remove()
  }, [])

  return null
}
