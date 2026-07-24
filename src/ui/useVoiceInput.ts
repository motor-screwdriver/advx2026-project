import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Web-only speech capture via the SpeechRecognition API. On native the OS
 * keyboard's dictation key covers voice input, so the mic button stays hidden.
 */
interface RecognitionResultEvent {
  results: ArrayLike<ArrayLike<{ transcript: string }>>
}

interface Recognition {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  onresult: ((event: RecognitionResultEvent) => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
  start: () => void
  stop: () => void
}

function recognitionClass(): (new () => Recognition) | null {
  const scope = globalThis as {
    SpeechRecognition?: new () => Recognition
    webkitSpeechRecognition?: new () => Recognition
  }
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition ?? null
}

export function useVoiceInput(onText: (text: string) => void) {
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef<Recognition | null>(null)
  const onTextRef = useRef(onText)
  onTextRef.current = onText
  const supported = recognitionClass() !== null

  useEffect(() => () => recognitionRef.current?.stop(), [])

  const toggle = useCallback(() => {
    if (listening) {
      recognitionRef.current?.stop()
      setListening(false)
      return
    }
    const RecognitionImpl = recognitionClass()
    if (!RecognitionImpl) {
      return
    }
    const recognition = new RecognitionImpl()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.onresult = (event) => {
      const transcript = Array.from({ length: event.results.length }, (_, i) => i)
        .map((i) => event.results[i][0]?.transcript ?? '')
        .join(' ')
        .trim()
      if (transcript) {
        onTextRef.current(transcript)
      }
    }
    recognition.onend = () => setListening(false)
    recognition.onerror = () => setListening(false)
    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
  }, [listening])

  return { supported, listening, toggle }
}
