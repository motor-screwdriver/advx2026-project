import { INITIAL_MIFIT_LOGIN_STATE, mifitLoginReducer } from '../mifitLoginFlow'

describe('Mi Fitness login UI flow', () => {
  it('moves from disconnected form to email code and connected', () => {
    let state = mifitLoginReducer(INITIAL_MIFIT_LOGIN_STATE, { type: 'open_form' })
    expect(state.phase).toBe('form')

    state = mifitLoginReducer(state, { type: 'connect_start' })
    expect(state.phase).toBe('connecting')

    state = mifitLoginReducer(state, {
      type: 'email_required',
      challengeId: 'challenge-1',
      region: 'de',
    })
    expect(state).toMatchObject({
      phase: 'email_code',
      challengeId: 'challenge-1',
      challengeRegion: 'de',
    })

    state = mifitLoginReducer(state, { type: 'verify_start' })
    expect(state.phase).toBe('verifying')

    state = mifitLoginReducer(state, { type: 'connected' })
    expect(state.phase).toBe('connected')
    expect(state.challengeId).toBeNull()
  })

  it('returns verification failures to the email code state', () => {
    const state = mifitLoginReducer(
      { ...INITIAL_MIFIT_LOGIN_STATE, phase: 'verifying', challengeId: 'c1' },
      { type: 'failed', error: 'Xiaomi authentication failed.' },
    )
    expect(state.phase).toBe('email_code')
    expect(state.error).toBe('Xiaomi authentication failed.')
  })
})
