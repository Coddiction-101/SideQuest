import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'

const TIMER_STORAGE_KEY = 'focusforge-state'
const SESSIONS_STORAGE_KEY = 'focusforge-sessions'
const SESSION_RETENTION_MS = 7 * 24 * 60 * 60 * 1000

function pruneExpiredSessions(sessions, now = Date.now()) {
  const cutoff = now - SESSION_RETENTION_MS
  return sessions.filter((session) => {
    if (!session || typeof session.completedAt !== 'string') return false
    const completedAt = Date.parse(session.completedAt)
    return Number.isFinite(completedAt) && completedAt >= cutoff
  })
}

function readSessions() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(SESSIONS_STORAGE_KEY) || '[]')
    return Array.isArray(saved) ? pruneExpiredSessions(saved) : []
  } catch (error) {
    console.error('Unable to read FocusForge session history.', error)
    return []
  }
}

function readTimerState() {
  const defaults = {
    minutes: 25,
    secondsLeft: 25 * 60,
    task: '',
    running: false,
    runningUntil: null,
    phase: 'focus',
    cycleEnabled: false,
    breakMinutes: 5,
    completedFocuses: 0,
    alertsEnabled: true,
    notificationsEnabled: false,
    statusMessage: '',
  }

  try {
    const saved = JSON.parse(window.localStorage.getItem(TIMER_STORAGE_KEY) || 'null')
    if (!saved || typeof saved !== 'object') return defaults

    const minutes = Number.isInteger(saved.minutes) && saved.minutes >= 1 && saved.minutes <= 180
      ? saved.minutes
      : defaults.minutes
    const breakMinutes = Number.isInteger(saved.breakMinutes) && saved.breakMinutes >= 1 && saved.breakMinutes <= 60
      ? saved.breakMinutes
      : defaults.breakMinutes
    const runningUntil = Number.isFinite(saved.runningUntil) ? saved.runningUntil : null
    const running = Boolean(saved.running && runningUntil)
    const secondsLeft = running
      ? Math.max(0, Math.ceil((runningUntil - Date.now()) / 1000))
      : Number.isInteger(saved.secondsLeft) && saved.secondsLeft >= 0
        ? saved.secondsLeft
        : minutes * 60

    return {
      ...defaults,
      ...saved,
      minutes,
      breakMinutes,
      running,
      runningUntil: running ? runningUntil : null,
      secondsLeft,
      phase: saved.phase === 'break' ? 'break' : 'focus',
      task: typeof saved.task === 'string' ? saved.task : '',
      cycleEnabled: Boolean(saved.cycleEnabled),
      completedFocuses: Number.isInteger(saved.completedFocuses) ? saved.completedFocuses : 0,
      alertsEnabled: saved.alertsEnabled !== false,
      notificationsEnabled: Boolean(saved.notificationsEnabled),
    }
  } catch (error) {
    console.error('Unable to restore the saved FocusForge timer.', error)
    return defaults
  }
}

function App() {
  const [timer, setTimer] = useState(readTimerState)
  const [sessions, setSessions] = useState(readSessions)
  const [customMinutes, setCustomMinutes] = useState('')
  const [editingSessionId, setEditingSessionId] = useState(null)
  const [editedTask, setEditedTask] = useState('')
  const audioContextRef = useRef(null)
  const completionHandledRef = useRef(false)
  const storageFailedRef = useRef(false)
  const [calendar, setCalendar] = useState(() => {
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setHours(0, 0, 0, 0)
    weekStart.setDate(weekStart.getDate() - 6)
    return { today: now.toDateString(), weekStart }
  })

  const {
    running,
    minutes,
    secondsLeft,
    task,
    phase,
    cycleEnabled,
    breakMinutes,
    alertsEnabled,
    notificationsEnabled,
    statusMessage,
  } = timer

  useEffect(() => {
    document.documentElement.dataset.focus = String(running)
    return () => {
      delete document.documentElement.dataset.focus
    }
  }, [running])

  useEffect(() => {
    try {
      window.localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(timer))
      window.localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions))
      storageFailedRef.current = false
    } catch (error) {
      if (!storageFailedRef.current) {
        console.error('Unable to save FocusForge data.', error)
        storageFailedRef.current = true
      }
    }
  }, [timer, sessions])

  useEffect(() => {
    const updateCalendar = () => {
      const now = new Date()
      const weekStart = new Date(now)
      weekStart.setHours(0, 0, 0, 0)
      weekStart.setDate(weekStart.getDate() - 6)
      setSessions((current) => {
        const retained = pruneExpiredSessions(current)
        return retained.length === current.length ? current : retained
      })
      setCalendar((current) => current.today === now.toDateString()
        ? current
        : { today: now.toDateString(), weekStart })
    }

    const interval = window.setInterval(updateCalendar, 60_000)
    return () => window.clearInterval(interval)
  }, [])

  const playCompletionAlert = useCallback(() => {
    if (!alertsEnabled) return

    try {
      const AudioContextConstructor = window.AudioContext || window.webkitAudioContext
      if (AudioContextConstructor) {
        const context = audioContextRef.current || new AudioContextConstructor()
        audioContextRef.current = context
        if (context.state === 'suspended') {
          context.resume().catch((error) => {
            console.error('Unable to resume the FocusForge completion sound.', error)
            setTimer((current) => ({ ...current, statusMessage: 'The completion sound could not be played.' }))
          })
        }
        const oscillator = context.createOscillator()
        const gain = context.createGain()
        oscillator.type = 'sine'
        oscillator.frequency.setValueAtTime(660, context.currentTime)
        oscillator.frequency.setValueAtTime(880, context.currentTime + 0.18)
        gain.gain.setValueAtTime(0.0001, context.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + 0.03)
        gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.45)
        oscillator.connect(gain)
        gain.connect(context.destination)
        oscillator.start()
        oscillator.stop(context.currentTime + 0.46)
      }
    } catch (error) {
      console.error('Unable to play the FocusForge completion sound.', error)
      setTimer((current) => ({ ...current, statusMessage: 'The completion sound could not be played.' }))
    }

    if (notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(phase === 'focus' ? 'Focus session complete' : 'Break complete', {
          body: phase === 'focus'
            ? (cycleEnabled ? 'Your break is ready when you are.' : 'Nice work. Take a moment to reset.')
            : 'Ready for another focus session?',
        })
      } catch (error) {
        console.error('Unable to show the FocusForge completion notification.', error)
        setTimer((current) => ({ ...current, statusMessage: 'The completion notification could not be shown.' }))
      }
    }
  }, [alertsEnabled, notificationsEnabled, phase, cycleEnabled])

  useEffect(() => {
    if (!running || !timer.runningUntil) return undefined

    const tick = () => {
      const remaining = Math.max(0, Math.ceil((timer.runningUntil - Date.now()) / 1000))
      if (remaining > 0) {
        setTimer((current) => current.secondsLeft === remaining
          ? current
          : { ...current, secondsLeft: remaining })
        return
      }
      if (completionHandledRef.current) return

      completionHandledRef.current = true
      playCompletionAlert()
      if (phase === 'focus') {
        const completedSession = {
          id: Date.now(),
          task: task.trim() || 'Untitled focus',
          duration: minutes,
          completedAt: new Date().toISOString(),
        }
        setSessions((current) => [completedSession, ...current])
        setTimer((current) => ({
          ...current,
          running: false,
          runningUntil: null,
          secondsLeft: current.cycleEnabled ? current.breakMinutes * 60 : 0,
          phase: current.cycleEnabled ? 'break' : 'focus',
          completedFocuses: current.completedFocuses + 1,
          statusMessage: current.cycleEnabled
            ? 'Focus complete. Start your break when ready.'
            : 'Focus session complete.',
        }))
      } else {
        setTimer((current) => ({
          ...current,
          running: false,
          runningUntil: null,
          secondsLeft: current.minutes * 60,
          phase: 'focus',
          statusMessage: 'Break complete. Ready to focus again?',
        }))
      }
    }

    tick()
    const interval = window.setInterval(tick, 250)
    return () => window.clearInterval(interval)
  }, [
    running,
    timer.runningUntil,
    phase,
    task,
    minutes,
    cycleEnabled,
    breakMinutes,
    alertsEnabled,
    notificationsEnabled,
    playCompletionAlert,
  ])

  const unlockAudio = () => {
    try {
      const AudioContextConstructor = window.AudioContext || window.webkitAudioContext
      if (!audioContextRef.current && AudioContextConstructor) {
        audioContextRef.current = new AudioContextConstructor()
      }
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume().catch((error) => {
          console.error('Unable to unlock the FocusForge completion sound.', error)
          setTimer((current) => ({ ...current, statusMessage: 'The completion sound is unavailable in this browser.' }))
        })
      }
    } catch (error) {
      console.error('Unable to initialize the FocusForge completion sound.', error)
      setTimer((current) => ({ ...current, statusMessage: 'The completion sound is unavailable in this browser.' }))
    }
  }

  const toggleTimer = () => {
    unlockAudio()
    completionHandledRef.current = false
    setTimer((current) => {
      if (current.running) {
        const remaining = current.runningUntil
          ? Math.max(0, Math.ceil((current.runningUntil - Date.now()) / 1000))
          : current.secondsLeft
        return {
          ...current,
          running: false,
          runningUntil: null,
          secondsLeft: remaining,
          statusMessage: current.phase === 'break' ? 'Break paused.' : 'Focus paused.',
        }
      }

      const nextSeconds = current.secondsLeft === 0 && current.phase === 'focus'
        ? current.minutes * 60
        : current.secondsLeft
      return {
        ...current,
        running: true,
        secondsLeft: nextSeconds,
        runningUntil: Date.now() + nextSeconds * 1000,
        statusMessage: current.phase === 'break' ? 'Break in progress.' : 'Focus in progress.',
      }
    })
  }

  const resetTimer = () => {
    completionHandledRef.current = false
    setTimer((current) => ({
      ...current,
      running: false,
      runningUntil: null,
      secondsLeft: current.minutes * 60,
      phase: 'focus',
      statusMessage: 'Timer reset.',
    }))
  }

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.repeat) return
      const target = event.target
      if (target instanceof HTMLElement && target.closest('input, textarea, select, button, a, [contenteditable="true"]')) return

      if (event.code === 'Space') {
        event.preventDefault()
        toggleTimer()
      } else if (event.key.toLowerCase() === 'r') {
        resetTimer()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  const chooseDuration = (duration) => {
    setTimer((current) => ({
      ...current,
      minutes: duration,
      secondsLeft: duration * 60,
      running: false,
      runningUntil: null,
      phase: 'focus',
      statusMessage: '',
    }))
    setCustomMinutes('')
    completionHandledRef.current = false
  }

  const applyCustomDuration = () => {
    const duration = Number(customMinutes)
    if (!Number.isInteger(duration) || duration < 1 || duration > 180) {
      setTimer((current) => ({ ...current, statusMessage: 'Choose a duration from 1 to 180 minutes.' }))
      return
    }
    chooseDuration(duration)
  }

  const handleRingDuration = (event) => {
    if (running) return
    const ring = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - ring.left - ring.width / 2
    const y = event.clientY - ring.top - ring.height / 2
    const angle = (Math.atan2(y, x) * 180 / Math.PI + 450) % 360
    chooseDuration(Math.round(1 + (angle / 360) * 179))
  }

  const handleRingPointer = (event) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    handleRingDuration(event)
  }

  const toggleCycle = (event) => {
    setTimer((current) => ({
      ...current,
      cycleEnabled: event.target.checked,
      phase: 'focus',
      secondsLeft: current.minutes * 60,
      running: false,
      runningUntil: null,
      statusMessage: '',
    }))
  }

  const updateBreakMinutes = (event) => {
    const value = Number(event.target.value)
    if (!Number.isInteger(value) || value < 1 || value > 60) return
    setTimer((current) => ({ ...current, breakMinutes: value }))
  }

  const enableNotifications = async () => {
    if (!('Notification' in window)) {
      setTimer((current) => ({ ...current, statusMessage: 'Notifications are not supported in this browser.' }))
      return
    }

    try {
      const permission = Notification.permission === 'default'
        ? await Notification.requestPermission()
        : Notification.permission
      setTimer((current) => ({
        ...current,
        notificationsEnabled: permission === 'granted',
        statusMessage: permission === 'granted'
          ? 'Completion notifications enabled.'
          : 'Notification permission was not granted.',
      }))
    } catch (error) {
      console.error('Unable to request FocusForge notification permission.', error)
      setTimer((current) => ({ ...current, statusMessage: 'Unable to enable notifications.' }))
    }
  }

  const beginEditingSession = (session) => {
    setEditingSessionId(session.id)
    setEditedTask(session.task)
    setTimer((current) => ({ ...current, statusMessage: '' }))
  }

  const cancelEditingSession = () => {
    setEditingSessionId(null)
    setEditedTask('')
  }

  const saveEditedTask = (event, sessionId) => {
    event.preventDefault()
    const nextTask = editedTask.trim()
    if (!nextTask) {
      setTimer((current) => ({ ...current, statusMessage: 'A completed task name cannot be empty.' }))
      return
    }

    setSessions((current) => current.map((session) => (
      session.id === sessionId ? { ...session, task: nextTask } : session
    )))
    cancelEditingSession()
    setTimer((current) => ({ ...current, statusMessage: 'Completed task updated.' }))
  }

  const displayMinutes = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const displaySeconds = String(secondsLeft % 60).padStart(2, '0')
  const todaysSessions = sessions.filter(
    (session) => new Date(session.completedAt).toDateString() === calendar.today,
  )
  const focusedToday = todaysSessions.reduce((total, session) => total + session.duration, 0)
  const weeklySessions = sessions.filter((session) => new Date(session.completedAt) >= calendar.weekStart)
  const weeklyMinutes = weeklySessions.reduce((total, session) => total + session.duration, 0)
  const recentSessions = sessions.slice(0, 8)
  const durationAngle = ((minutes - 1) / 179) * 360 - 90
  const handleX = 50 + Math.cos(durationAngle * Math.PI / 180) * 50
  const handleY = 50 + Math.sin(durationAngle * Math.PI / 180) * 50
  return (
    <main className={`focusforge${running ? ' is-running' : ''}`}>
      <header className="topbar">
        <a className="brand" href={import.meta.env.BASE_URL} aria-label="FocusForge home">
          <span>FocusForge</span>
        </a>
        <span className="keyboard-hint">Space: start/pause <kbd>R</kbd>: reset</span>
      </header>

      <section className="session-layout" aria-labelledby="session-title">
        <div className="session-copy">
          <h1 id="session-title">LOCK IN AND GET THINGS DONE, MAN. :)</h1>
          <label className="task-field">
            <span>Current task</span>
            <input
              value={task}
              onChange={(event) => setTimer((current) => ({ ...current, task: event.target.value }))}
              placeholder="What are you working on?"
              disabled={running}
            />
          </label>
        </div>

        <div
          className={`session-ring${running ? ' is-running' : ''}`}
          style={{ '--handle-x': `${handleX}%`, '--handle-y': `${handleY}%` }}
          onPointerDown={running ? undefined : handleRingPointer}
          onPointerMove={running ? undefined : (event) => {
            if (event.buttons === 1) handleRingDuration(event)
          }}
        >
          <div className="session-ring-inner">
            <span className="session-time">{displayMinutes}:{displaySeconds}</span>
            <span className="session-state">{running ? (phase === 'break' ? 'On break' : 'In focus') : (phase === 'break' ? 'Break ready' : 'Ready')}</span>
            <span className="session-task">{task.trim() || (phase === 'break' ? 'Take a breather' : 'Choose a task')}</span>
          </div>
          {!running && phase === 'focus' && (
            <>
              <span className="ring-duration">{minutes}<small>MIN</small></span>
              <span className="ring-duration-handle" aria-hidden="true"></span>
            </>
          )}
        </div>
      </section>

      <div className="session-controls">
        <div className="duration-slider">
          <div className="slider-heading">
            <span>Focus length</span>
            <strong>{minutes} min</strong>
          </div>
          <input
            type="range"
            min="1"
            max="180"
            value={minutes}
            onChange={(event) => chooseDuration(Number(event.target.value))}
            disabled={running || phase === 'break'}
            aria-label="Focus duration"
          />
        </div>
        <div className="custom-duration">
          <input
            type="number"
            min="1"
            max="180"
            value={customMinutes}
            onChange={(event) => setCustomMinutes(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') applyCustomDuration()
            }}
            placeholder="Custom"
            aria-label="Custom duration in minutes"
            disabled={running || phase === 'break'}
          />
          <button type="button" onClick={applyCustomDuration} disabled={running || phase === 'break'}>Set</button>
        </div>
        <button className="start-button" type="button" onClick={toggleTimer} aria-keyshortcuts="Space">
          {running ? (phase === 'break' ? 'Pause break' : 'Pause') : phase === 'break' ? 'Start break' : secondsLeft === 0 ? 'Start again' : 'Start focus'}
        </button>
        <button className="reset-button" type="button" onClick={resetTimer} aria-keyshortcuts="R">Reset</button>
      </div>

      <p className="status-message" role="status">{statusMessage}</p>

      <section className="settings-panel" aria-labelledby="settings-title">
        <div className="settings-heading">
          <div>
            <h2 id="settings-title">Session settings</h2>
            <p>Breaks and notifications</p>
          </div>
          <span className="cycle-count">{weeklySessions.length} focus sessions in the last 7 days</span>
        </div>
        <div className="focus-options" aria-label="Timer options">
          <label className="option-toggle">
            <input type="checkbox" checked={cycleEnabled} onChange={toggleCycle} disabled={running} />
            <span>Auto break after focus</span>
          </label>
          <label className="break-length">
            <span>Break length</span>
            <input
              type="number"
              min="1"
              max="60"
              value={breakMinutes}
              onChange={updateBreakMinutes}
              disabled={!cycleEnabled || running || phase === 'break'}
              aria-label="Break length in minutes"
            />
            <span>min</span>
          </label>
          <button
            type="button"
            className="text-button"
            aria-pressed={alertsEnabled}
            onClick={() => setTimer((current) => ({ ...current, alertsEnabled: !current.alertsEnabled }))}
          >
            Alerts {alertsEnabled ? 'on' : 'muted'}
          </button>
          <button type="button" className="text-button" onClick={enableNotifications} disabled={notificationsEnabled}>
            {notificationsEnabled ? 'Notifications on' : 'Enable notifications'}
          </button>
        </div>
      </section>

      <section className="focus-data" aria-label="Focus summary">
        <div>
          <span className="data-label">Today</span>
          <strong>{focusedToday} min</strong>
        </div>
        <div>
          <span className="data-label">Sessions today</span>
          <strong>{todaysSessions.length}</strong>
        </div>
        <div>
          <span className="data-label">Last 7 days</span>
          <strong>{weeklyMinutes} min · {weeklySessions.length} sessions</strong>
        </div>
      </section>

      <section className="session-history" aria-labelledby="history-title">
        <h2 id="history-title">Recent sessions</h2>
        {recentSessions.length === 0 ? (
          <p className="empty-history">Completed focus sessions will show up here.</p>
        ) : (
          <ul>
            {recentSessions.map((session) => (
              <li key={session.id} className={editingSessionId === session.id ? 'is-editing' : ''}>
                {editingSessionId === session.id ? (
                  <form className="history-edit-form" onSubmit={(event) => saveEditedTask(event, session.id)}>
                    <input
                      autoFocus
                      value={editedTask}
                      onChange={(event) => setEditedTask(event.target.value)}
                      aria-label="Edit completed task"
                      maxLength="120"
                    />
                    <button type="submit" className="history-action">Save</button>
                    <button type="button" className="history-action" onClick={cancelEditingSession}>Cancel</button>
                  </form>
                ) : (
                  <>
                    <span className="history-task">{session.task}</span>
                    <span className="history-duration">{session.duration} min</span>
                    <time dateTime={session.completedAt}>
                      {new Date(session.completedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </time>
                    <button
                      type="button"
                      className="history-action"
                      onClick={() => beginEditingSession(session)}
                      aria-label={`Edit task: ${session.task}`}
                    >
                      Edit
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}

export default App
