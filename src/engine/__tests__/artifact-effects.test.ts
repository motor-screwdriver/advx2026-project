import { applyNightTurn } from '../turn'
import { makeGame, TURN, WINDOW } from './fixtures'

describe('warm_blanket (equipment): skip oversleep penalty', () => {
  it('removes oversleep penalty when equipped in utilities', () => {
    // Oversleep: sleep 12h (window is 7.5h, grace is 2h → 12h > 9.5h)
    const state = makeGame({
      artifacts: ['warm_blanket'],
      equipped: { armor: null, utilities: 'warm_blanket', charm: null },
    })
    const withBlanket = applyNightTurn(state, {
      ...TURN,
      bedTime: WINDOW.bedMin,
      wakeTime: WINDOW.bedMin + 720, // 12h sleep
    })
    const plain = applyNightTurn(makeGame(), {
      ...TURN,
      bedTime: WINDOW.bedMin,
      wakeTime: WINDOW.bedMin + 720,
    })
    // warm_blanket should give a higher score (no 10-point oversleep penalty)
    expect(withBlanket.evaluation.score).toBeGreaterThan(plain.evaluation.score)
  })

  it('does NOT work if warm_blanket is in inventory but NOT equipped', () => {
    const state = makeGame({
      artifacts: ['warm_blanket'],
      equipped: { armor: null, utilities: null, charm: null },
    })
    const result = applyNightTurn(state, {
      ...TURN,
      bedTime: WINDOW.bedMin,
      wakeTime: WINDOW.bedMin + 720,
    })
    const plain = applyNightTurn(makeGame(), {
      ...TURN,
      bedTime: WINDOW.bedMin,
      wakeTime: WINDOW.bedMin + 720,
    })
    expect(result.evaluation.score).toBe(plain.evaluation.score)
  })
})

describe('coffee_amulet (equipment): +30 min bed tolerance', () => {
  it('reduces bedtime penalty by 30 min when equipped in utilities', () => {
    // 45 min late to bed: without amulet, penalty = 45*0.25 = 11.25
    // with amulet: effective deviation = 15, penalty = 15*0.25 = 3.75
    const state = makeGame({
      artifacts: ['coffee_amulet'],
      equipped: { armor: null, utilities: 'coffee_amulet', charm: null },
    })
    const withAmulet = applyNightTurn(state, {
      ...TURN,
      bedTime: WINDOW.bedMin + 45,
      wakeTime: WINDOW.wakeMin + 45,
    })
    const plain = applyNightTurn(makeGame(), {
      ...TURN,
      bedTime: WINDOW.bedMin + 45,
      wakeTime: WINDOW.wakeMin + 45,
    })
    expect(withAmulet.evaluation.score).toBeGreaterThan(plain.evaluation.score)
  })

  it('does NOT work if coffee_amulet is in inventory but NOT equipped', () => {
    const state = makeGame({ artifacts: ['coffee_amulet'] })
    const result = applyNightTurn(state, {
      ...TURN,
      bedTime: WINDOW.bedMin + 45,
      wakeTime: WINDOW.wakeMin + 45,
    })
    const plain = applyNightTurn(makeGame(), {
      ...TURN,
      bedTime: WINDOW.bedMin + 45,
      wakeTime: WINDOW.wakeMin + 45,
    })
    expect(result.evaluation.score).toBe(plain.evaluation.score)
  })
})

describe('alarm_bell (equipment): +30 min wake tolerance', () => {
  it('reduces wake-time penalty by 30 min when equipped in utilities', () => {
    // 45 min late wake: without bell, penalty = 45*0.25 = 11.25
    // with bell: effective deviation = 15, penalty = 15*0.25 = 3.75
    const state = makeGame({
      artifacts: ['alarm_bell'],
      equipped: { armor: null, utilities: 'alarm_bell', charm: null },
    })
    const withBell = applyNightTurn(state, {
      ...TURN,
      bedTime: WINDOW.bedMin,
      wakeTime: WINDOW.wakeMin + 45,
    })
    const plain = applyNightTurn(makeGame(), {
      ...TURN,
      bedTime: WINDOW.bedMin,
      wakeTime: WINDOW.wakeMin + 45,
    })
    expect(withBell.evaluation.score).toBeGreaterThan(plain.evaluation.score)
  })

  it('does NOT work if alarm_bell is in inventory but NOT equipped', () => {
    const state = makeGame({ artifacts: ['alarm_bell'] })
    const result = applyNightTurn(state, {
      ...TURN,
      bedTime: WINDOW.bedMin,
      wakeTime: WINDOW.wakeMin + 45,
    })
    const plain = applyNightTurn(makeGame(), {
      ...TURN,
      bedTime: WINDOW.bedMin,
      wakeTime: WINDOW.wakeMin + 45,
    })
    expect(result.evaluation.score).toBe(plain.evaluation.score)
  })
})

describe('night_watch (equipment): auto-fill missed night', () => {
  it('converts a MISSED night to GOOD when equipped and charge ready', () => {
    const state = makeGame({
      artifacts: ['night_watch'],
      equipped: { armor: null, utilities: 'night_watch', charm: null },
    })
    const result = applyNightTurn(state, {
      ...TURN,
      nightWatchAvailable: true,
      bedTime: null,
      wakeTime: null,
    })
    expect(result.evaluation.outcome).toBe('GOOD')
    expect(result.nightWatchUsed).toBe(true)
    expect(result.game.hp).toBe(7) // no damage
    expect(result.game.perfectWeekStreak).toBe(1) // builds streak
  })

  it('does NOT activate when charge is not available', () => {
    const state = makeGame({
      artifacts: ['night_watch'],
      equipped: { armor: null, utilities: 'night_watch', charm: null },
    })
    const result = applyNightTurn(state, {
      ...TURN,
      nightWatchAvailable: false,
      bedTime: null,
      wakeTime: null,
    })
    expect(result.evaluation.outcome).toBe('MISSED')
    expect(result.nightWatchUsed).toBe(false)
  })

  it('does NOT activate when night_watch is not equipped', () => {
    const state = makeGame({ artifacts: ['night_watch'] })
    const result = applyNightTurn(state, {
      ...TURN,
      nightWatchAvailable: false, // store would not set true if not equipped
      bedTime: null,
      wakeTime: null,
    })
    expect(result.evaluation.outcome).toBe('MISSED')
    expect(result.nightWatchUsed).toBe(false)
  })
})
