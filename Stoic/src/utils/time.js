export function timerRemaining(timer, now) {
  return Math.max(0, timer.endsAt === null ? timer.remaining : timer.endsAt - now)
}

export function stopwatchElapsed(stopwatch, now) {
  return stopwatch.elapsed + (stopwatch.startedAt === null ? 0 : Math.max(0, now - stopwatch.startedAt))
}

export function formatClock(milliseconds, roundUp = false) {
  const seconds = Math.max(0, (roundUp ? Math.ceil : Math.floor)(milliseconds / 1000))
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor(seconds / 60) % 60
  const rest = seconds % 60
  return [ ...(hours ? [String(hours)] : []), String(minutes).padStart(2, '0'), String(rest).padStart(2, '0') ].join(':')
}

export function countdownParts(target, now) {
  const seconds = Math.max(0, Math.ceil((target - now) / 1000))
  return [Math.floor(seconds / 86400), Math.floor(seconds / 3600) % 24, Math.floor(seconds / 60) % 60, seconds % 60]
}
