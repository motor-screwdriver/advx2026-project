import { useEffect, useReducer, useState, type Dispatch } from 'react'

import type { MiFitnessRegion, MiFitnessSession } from '../contracts/mifit'
import { useMiFitnessStore } from '../state/mifitStore'
import {
  deleteMiFitnessSession,
  loadMiFitnessSession,
  loginToMiFitness,
  miFitnessSessionRecord,
  saveMiFitnessSession,
  verifyMiFitnessEmail,
} from '../systems/mifit'
import {
  INITIAL_MIFIT_LOGIN_STATE,
  mifitLoginReducer,
  type MiFitnessLoginEvent,
  type MiFitnessLoginPhase,
} from '../ui/mifitLoginFlow'
import { strings } from '../ui/strings'

export interface MiFitnessLoginModel {
  connected: boolean
  connectedRegion: MiFitnessRegion | null
  savedAt: string | null
  phase: MiFitnessLoginPhase
  error: string | null
  region: MiFitnessRegion | null
  username: string
  password: string
  code: string
  openForm: () => void
  setRegion: (region: MiFitnessRegion) => void
  setUsername: (value: string) => void
  setPassword: (value: string) => void
  setCode: (value: string) => void
  connect: () => void
  verify: () => void
  disconnect: () => void
}

export function useMiFitnessLogin(): MiFitnessLoginModel {
  const meta = useMiFitnessStore()
  const [flow, dispatch] = useReducer(mifitLoginReducer, INITIAL_MIFIT_LOGIN_STATE)
  const [region, setRegion] = useState<MiFitnessRegion | null>(meta.region)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')

  useEffect(() => {
    void reconcileSavedSession(setRegion)
  }, [])

  const connect = () => {
    void connectWithPassword({ region, username, password, setPassword, dispatch })
  }
  const verify = () => {
    void verifyEmailCode({ challengeId: flow.challengeId, code, setCode, dispatch })
  }
  const disconnect = () => {
    void disconnectMiFitness(setUsername, setPassword, setCode, dispatch)
  }
  return {
    connected: meta.connected,
    connectedRegion: meta.region,
    savedAt: meta.savedAt,
    phase: flow.phase,
    error: flow.error ?? meta.lastError,
    region,
    username,
    password,
    code,
    openForm: () => dispatch({ type: 'open_form' }),
    setRegion,
    setUsername,
    setPassword,
    setCode,
    connect,
    verify,
    disconnect,
  }
}

async function reconcileSavedSession(setRegion: (region: MiFitnessRegion) => void): Promise<void> {
  const saved = await loadMiFitnessSession()
  if (saved) {
    useMiFitnessStore.getState().setConnected(saved.region, saved.savedAt)
    setRegion(saved.region)
    return
  }
  if (useMiFitnessStore.getState().connected) {
    useMiFitnessStore.getState().disconnectMeta()
  }
}

async function connectWithPassword(input: {
  region: MiFitnessRegion | null
  username: string
  password: string
  setPassword: (value: string) => void
  dispatch: Dispatch<MiFitnessLoginEvent>
}): Promise<void> {
  if (!input.region || !input.username.trim() || !input.password) {
    return
  }
  input.dispatch({ type: 'connect_start' })
  try {
    const response = await loginToMiFitness({
      username: input.username.trim(),
      password: input.password,
      region: input.region,
    })
    input.setPassword('')
    if (response.status === 'email_verification_required') {
      input.dispatch({
        type: 'email_required',
        challengeId: response.challengeId,
        region: response.region,
      })
      return
    }
    await persistConnected(response.region, response.session, input.dispatch)
  } catch (err) {
    input.setPassword('')
    fail(err, input.dispatch)
  }
}

async function verifyEmailCode(input: {
  challengeId: string | null
  code: string
  setCode: (value: string) => void
  dispatch: Dispatch<MiFitnessLoginEvent>
}): Promise<void> {
  if (!input.challengeId || !input.code.trim()) {
    return
  }
  input.dispatch({ type: 'verify_start' })
  try {
    const response = await verifyMiFitnessEmail({
      challengeId: input.challengeId,
      code: input.code,
    })
    input.setCode('')
    if (response.status === 'connected') {
      await persistConnected(response.region, response.session, input.dispatch)
    }
  } catch (err) {
    input.setCode('')
    fail(err, input.dispatch)
  }
}

async function persistConnected(
  region: MiFitnessRegion,
  session: MiFitnessSession,
  dispatch: Dispatch<MiFitnessLoginEvent>,
): Promise<void> {
  const record = miFitnessSessionRecord(region, session)
  await saveMiFitnessSession(record)
  useMiFitnessStore.getState().setConnected(region, record.savedAt)
  dispatch({ type: 'connected' })
}

async function disconnectMiFitness(
  setUsername: (value: string) => void,
  setPassword: (value: string) => void,
  setCode: (value: string) => void,
  dispatch: Dispatch<MiFitnessLoginEvent>,
): Promise<void> {
  await deleteMiFitnessSession()
  useMiFitnessStore.getState().disconnectMeta()
  setUsername('')
  setPassword('')
  setCode('')
  dispatch({ type: 'reset' })
}

function fail(err: unknown, dispatch: Dispatch<MiFitnessLoginEvent>): void {
  const message = err instanceof Error ? err.message : strings.mifit_error_generic
  useMiFitnessStore.getState().setLastError(message)
  dispatch({ type: 'failed', error: message })
}
