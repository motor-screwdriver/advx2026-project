import { useEffect, useState } from 'react'
import { AccessibilityInfo } from 'react-native'

/** True when the OS asks apps to reduce motion (animations should be still). */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduced)
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced)
    return () => subscription.remove()
  }, [])
  return reduced
}
