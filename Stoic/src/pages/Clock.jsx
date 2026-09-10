import { useState } from 'react'
import { countdownParts, formatClock } from '../utils/time.js'

function DurationForm({ clock }) {
  const [minutes, setMinutes] = useState(String(clock.timer.duration / 60000))
  return (
    <details className="duration-settings">
      <summary>Set duration</summary>
      <form className="inline-form" onSubmit={event => {
        event.preventDefault()
        clock.setDuration(Number(minutes))
        event.currentTarget.closest('details').open = false
      }}>
        <label>Minutes<input type="number" min="1" max="1440" step="1" required value={minutes} onChange={event => setMinutes(event.target.value)} disabled={clock.running} /></label>
        <button className="soft-button" disabled={clock.running}>Set</button>
      </form>
    </details>
  )
}

export default function Clock({ clock, now, sound, onToggleSound, previewSound }) {
  const [soundError, setSoundError] = useState('')
  const modes = ['Timer', 'Countdown', 'Stopwatch']
  const targetTime = clock.target ? new Date(clock.target).getTime() : null
  const countdown = targetTime === null ? [0, 0, 0, 0] : countdownParts(targetTime, now)
  const stopwatchRunning = clock.stopwatch.startedAt !== null
  return (
    <section className="clock-page" aria-labelledby="page-heading">
      <h1 id="page-heading" className="sr-only">Clock</h1>
      <div className="segmented-control" role="tablist" aria-label="Clock mode">
        {modes.map((mode, index) => <button key={mode} role="tab" id={`tab-${mode}`} aria-controls={`panel-${mode}`} aria-selected={clock.mode === mode} tabIndex={clock.mode === mode ? 0 : -1} onClick={() => clock.setMode(mode)} onKeyDown={event => {
          let next
          if (event.key === 'ArrowRight') next = (index + 1) % modes.length
          if (event.key === 'ArrowLeft') next = (index + modes.length - 1) % modes.length
          if (event.key === 'Home') next = 0
          if (event.key === 'End') next = modes.length - 1
          if (next !== undefined) { event.preventDefault(); clock.setMode(modes[next]); document.getElementById(`tab-${modes[next]}`).focus() }
        }}>{mode}</button>)}
      </div>
      <div className="clock-panel" role="tabpanel" id={`panel-${clock.mode}`} aria-labelledby={`tab-${clock.mode}`}>
        {clock.mode === 'Timer' && <>
          <div className="clock-stage"><span className={`clock-time ${formatClock(clock.remaining, true).length > 5 ? 'long-time' : ''}`} role="timer" aria-label="Time remaining">{formatClock(clock.remaining, true)}</span></div>
          <div className="clock-controls"><button className="soft-button" onClick={clock.toggleTimer}>{clock.running ? 'Pause' : clock.remaining === 0 ? 'Start again' : clock.remaining < clock.timer.duration ? 'Resume' : 'Start'}</button><button className="soft-button" onClick={clock.resetTimer}>Reset</button></div>
          <p className="clock-caption">{clock.timer.duration / 60000} minute focus session</p>
          <DurationForm clock={clock} />
          <div className="sound-controls"><label><input type="checkbox" checked={sound} onChange={onToggleSound} /> Completion sound</label>{sound && <button className="text-button" onClick={async () => { setSoundError(await previewSound() ? '' : 'Sound is unavailable in this browser.') }}>Preview</button>}</div>
          {sound && <p className="sound-note">Plays while Stoic is open.</p>}
          {soundError && <p className="sound-note" role="status">{soundError}</p>}
        </>}
        {clock.mode === 'Stopwatch' && <>
          <div className="clock-stage"><span className={`clock-time ${formatClock(clock.elapsed).length > 5 ? 'long-time' : ''}`} role="timer" aria-label="Elapsed time">{formatClock(clock.elapsed)}</span></div>
          <div className="clock-controls"><button className="soft-button" onClick={clock.toggleStopwatch}>{stopwatchRunning ? 'Pause' : clock.elapsed > 0 ? 'Resume' : 'Start'}</button><button className="soft-button" onClick={clock.resetStopwatch}>Reset</button></div>
          <p className="clock-caption">One thing at a time.</p>
        </>}
        {clock.mode === 'Countdown' && <>
          <div className="clock-stage countdown-stage" role="timer" aria-label="Time until target">
            {countdown.map((value, index) => <div className="countdown-unit" key={index}><strong>{String(value).padStart(2, '0')}</strong><span>{['Days', 'Hours', 'Minutes', 'Seconds'][index]}</span></div>)}
          </div>
          <label className="target-field">Count down to<input aria-label="Countdown target" type="datetime-local" value={clock.target} onChange={event => clock.setTarget(event.target.value)} /></label>
          <p className="clock-caption" role="status">{targetTime === null ? 'Choose a moment to count down to.' : targetTime <= now ? 'Your target time has arrived.' : 'Time remaining until your chosen moment.'}</p>
          {clock.target && <button className="text-button countdown-clear" onClick={() => clock.setTarget('')}>Clear</button>}
        </>}
      </div>
    </section>
  )
}
