import { useEffect, useRef } from 'react'

export function useChime(enabled, endsAt, remaining) {
  const context = useRef(null)
  const observedDeadline = useRef(null)
  const lastPlayed = useRef(null)

  async function arm() {
    try {
      const Audio = window.AudioContext || window.webkitAudioContext
      if (!Audio) return false
      context.current ??= new Audio()
      if (context.current.state !== 'running') await context.current.resume()
      return context.current.state === 'running'
    } catch { return false }
  }

  function play() {
    const audio = context.current
    if (!audio || audio.state !== 'running') return
    for (const [offset, frequency] of [[0, 660], [0.22, 880]]) {
      const oscillator = audio.createOscillator()
      const gain = audio.createGain()
      const start = audio.currentTime + offset
      oscillator.frequency.value = frequency
      gain.gain.setValueAtTime(0, start)
      gain.gain.linearRampToValueAtTime(0.075, start + 0.025)
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.8)
      oscillator.connect(gain)
      gain.connect(audio.destination)
      oscillator.start(start)
      oscillator.stop(start + 0.85)
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect() }
    }
  }

  useEffect(() => {
    if (endsAt !== null && remaining > 0) observedDeadline.current = endsAt
    if (remaining === 0 && observedDeadline.current && lastPlayed.current !== observedDeadline.current) {
      lastPlayed.current = observedDeadline.current
      if (enabled) play()
    }
  }, [enabled, endsAt, remaining])

  useEffect(() => {
    const unlock = () => { if (enabled) void arm() }
    window.addEventListener('pointerdown', unlock)
    window.addEventListener('keydown', unlock)
    return () => { window.removeEventListener('pointerdown', unlock); window.removeEventListener('keydown', unlock) }
  }, [enabled])

  useEffect(() => () => { if (context.current) void context.current.close() }, [])
  return { arm, preview: async () => { if (await arm()) { play(); return true } return false } }
}
