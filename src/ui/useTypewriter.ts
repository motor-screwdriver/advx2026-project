import { useEffect, useState } from 'react'

import { useReducedMotion } from './useReducedMotion'

/**
 * Reveals `text` character by character (~30 chars/sec) while `animate` is on.
 * With reduced motion or animate=false the full text is shown at once.
 * Restarts whenever the text changes; `done` flips true at the end.
 */
export function useTypewriter(text: string, animate: boolean): { shown: string; done: boolean } {
  const reduced = useReducedMotion()
  const active = animate && !reduced
  const [count, setCount] = useState(text.length)

  useEffect(() => {
    setCount(active ? 0 : text.length)
  }, [text, active, text.length])

  useEffect(() => {
    if (!active || count >= text.length) {
      return
    }
    const timer = setInterval(() => setCount((c) => Math.min(text.length, c + 2)), 66)
    return () => clearInterval(timer)
  }, [active, count, text.length])

  return { shown: text.slice(0, count), done: count >= text.length }
}
