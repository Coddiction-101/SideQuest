import { useEffect } from 'react'
import { useStoredState } from './useStoredState.js'
import { timerRemaining, stopwatchElapsed } from '../utils/time.js'

const initialClock = {
  mode: 'Timer',
  timer: { duration: 25 * 60000, remaining: 25 * 60000, endsAt: null },
  stopwatch: { elapsed: 0, startedAt: null },
  target: '',
}
const nonnegative = value => Number.isFinite(value) && value >= 0
const timestamp = value => value === null || nonnegative(value)
const validClock = value => value && ['Timer', 'Countdown', 'Stopwatch'].includes(value.mode) &&
  value.timer && nonnegative(value.timer.duration) && value.timer.duration > 0 && nonnegative(value.timer.remaining) && timestamp(value.timer.endsAt) &&
  value.stopwatch && nonnegative(value.stopwatch.elapsed) && timestamp(value.stopwatch.startedAt) &&
  typeof value.target === 'string' && (value.target === '' || Number.isFinite(new Date(value.target).getTime()))

export function useClock(now) {
  const [state, setState, error] = useStoredState('stoic.clock.v1', initialClock, validClock)
  const remaining = timerRemaining(state.timer, now)
  const elapsed = stopwatchElapsed(state.stopwatch, now)

  useEffect(() => {
    if (state.timer.endsAt !== null && remaining === 0) {
      setState(current => current.timer.endsAt !== null && timerRemaining(current.timer, Date.now()) === 0
        ? { ...current, timer: { ...current.timer, endsAt: null, remaining: 0 } } : current)
    }
  }, [remaining, state.timer.endsAt, setState])

  function toggleTimer() {
    setState(current => {
      const time = Date.now()
      const left = timerRemaining(current.timer, time)
      const timer = current.timer.endsAt !== null && left > 0
        ? { ...current.timer, remaining: left, endsAt: null }
        : { ...current.timer, remaining: left || current.timer.duration, endsAt: time + (left || current.timer.duration) }
      return { ...current, timer }
    })
  }

  function resetTimer() {
    setState(current => ({ ...current, timer: { ...current.timer, remaining: current.timer.duration, endsAt: null } }))
  }

  function setDuration(minutes) {
    if (!Number.isFinite(minutes) || minutes < 1 || minutes > 1440) return
    const duration = minutes * 60000
    setState(current => ({ ...current, timer: { duration, remaining: duration, endsAt: null } }))
  }

  function toggleStopwatch() {
    setState(current => ({ ...current, stopwatch: current.stopwatch.startedAt === null
      ? { ...current.stopwatch, startedAt: Date.now() }
      : { elapsed: stopwatchElapsed(current.stopwatch, Date.now()), startedAt: null } }))
  }

  return {
    ...state, remaining, elapsed, error,
    running: state.timer.endsAt !== null && remaining > 0,
    toggleTimer, resetTimer, setDuration, toggleStopwatch,
    resetStopwatch: () => setState(current => ({ ...current, stopwatch: { elapsed: 0, startedAt: null } })),
    setMode: mode => setState(current => ({ ...current, mode })),
    setTarget: target => setState(current => ({ ...current, target })),
  }
}
