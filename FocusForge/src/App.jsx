import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import './App.css'

function App() {
  const pageRef = useRef(null)
  const [running, setRunning] = useState(false)
  const [minutes, setMinutes] = useState(25)
  const [secondsLeft, setSecondsLeft] = useState(25 * 60)
  const [task, setTask] = useState('')
  const [customMinutes, setCustomMinutes] = useState('')
  const [sessions, setSessions] = useState(() => {
    try {
      const saved = window.localStorage.getItem('focusforge-sessions')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [today] = useState(() => new Date().toDateString())

  useEffect(() => {
    document.documentElement.dataset.focus = String(running)
    return () => {
      delete document.documentElement.dataset.focus
    }
  }, [running])

  useEffect(() => {
    const context = gsap.context(() => {
      gsap.from('.focusmark', {
        opacity: 0,
        y: 16,
        duration: 0.6,
        ease: 'power3.out',
      })
      gsap.from('.session-ring, .session-copy', {
        opacity: 0,
        duration: 0.8,
        delay: 0.15,
        ease: 'power3.out',
        stagger: 0.08,
      })
    }, pageRef)

    return () => context.revert()
  }, [])

  useEffect(() => {
    if (!running) return

    const timer = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          setRunning(false)
          const session = {
            id: Date.now(),
            task: task.trim() || 'Untitled focus',
            duration: minutes,
            completedAt: new Date().toISOString(),
          }
          setSessions((currentSessions) => {
            const nextSessions = [...currentSessions, session]
            window.localStorage.setItem('focusforge-sessions', JSON.stringify(nextSessions))
            return nextSessions
          })
          return 0
        }
        return current - 1
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [running, task, minutes])

  const displayMinutes = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const displaySeconds = String(secondsLeft % 60).padStart(2, '0')
  const todaysSessions = sessions.filter(
    (session) => new Date(session.completedAt).toDateString() === today,
  )
  const focusedToday = todaysSessions.reduce((total, session) => total + session.duration, 0)

  const sessionProgress = Math.min(1, Math.max(0, 1 - secondsLeft / (minutes * 60)))

  const chooseDuration = (duration) => {
    setMinutes(duration)
    setSecondsLeft(duration * 60)
    setRunning(false)
    setCustomMinutes('')
  }

  const applyCustomDuration = () => {
    const duration = Number(customMinutes)
    if (!Number.isInteger(duration) || duration < 1 || duration > 180) return
    chooseDuration(duration)
  }

  const resetTimer = () => {
    setRunning(false)
    setSecondsLeft(minutes * 60)
  }

  const toggleTimer = () => {
    if (running) {
      setRunning(false)
      return
    }
    if (secondsLeft === 0) setSecondsLeft(minutes * 60)
    setRunning(true)
  }

  const changeDuration = (duration) => {
    const nextMinutes = Math.min(180, Math.max(1, Math.round(duration)))
    chooseDuration(nextMinutes)
  }

  const handleRingDuration = (event) => {
    if (running) return
    const ring = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - ring.left - ring.width / 2
    const y = event.clientY - ring.top - ring.height / 2
    const angle = (Math.atan2(y, x) * 180 / Math.PI + 450) % 360
    const nextMinutes = Math.round(1 + (angle / 360) * 179)
    changeDuration(nextMinutes)
  }

  const handleRingPointer = (event) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    handleRingDuration(event)
  }

  const durationProgress = ((minutes - 1) / 179) * 100
  const durationAngle = ((minutes - 1) / 179) * 360 - 90
  const handleX = 50 + Math.cos(durationAngle * Math.PI / 180) * 50
  const handleY = 50 + Math.sin(durationAngle * Math.PI / 180) * 50

  return (
    <main className={`focusforge${running ? ' is-running' : ''}`} ref={pageRef}>
      <header className="topbar">
        <a className="brand focusmark" href={import.meta.env.BASE_URL} aria-label="FocusForge home">
          <span>FocusForge</span>
        </a>
      </header>

      <section className="session-layout" aria-labelledby="session-title">
        <div className="session-copy">
          <p className="session-kicker">Deep work session</p>
          <h1 id="session-title">LOCK IN AND GET THINGS DONE, MAN. :)</h1>
          <p className="session-description">
            No Excuses
          </p>
          <label className="task-field">
            <span>Current task</span>
            <input
              value={task}
              onChange={(event) => setTask(event.target.value)}
              placeholder="What are you working on?"
              disabled={running}
            />
          </label>
        </div>

        <div
          className={`session-ring${running ? ' is-running' : ''}`}
          style={{
            '--duration-progress': `${durationProgress}%`,
            '--handle-x': `${handleX}%`,
            '--handle-y': `${handleY}%`,
          }}
          onPointerDown={running ? undefined : handleRingPointer}
          onPointerMove={running ? undefined : (event) => {
            if (event.buttons === 1) handleRingDuration(event)
          }}
        >
          <div className="session-ring-inner">
            <span className="session-time">{displayMinutes}:{displaySeconds}</span>
            <span className="session-state">{running ? 'In focus' : 'Ready'}</span>
            <span className="session-task">{task.trim() || 'Choose a task'}</span>
          </div>
        {running && (
          <svg
            className="timer-progress"
            viewBox="0 0 100 100"
            role="progressbar"
            aria-label="Focus session progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(sessionProgress * 100)}
            focusable="false"
          >
            <defs>
              <linearGradient id="smoke-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#c5ffe6" />
                <stop offset="50%" stopColor="#90ead7" />
                <stop offset="100%" stopColor="#a8bdff" />
              </linearGradient>
              <filter id="smoke-distortion" x="-30%" y="-30%" width="160%" height="160%">
                <feTurbulence
                  type="fractalNoise"
                  baseFrequency="0.022"
                  numOctaves="2"
                  seed="12"
                >
                  <animate
                    attributeName="baseFrequency"
                    values="0.018;0.034;0.018"
                    dur="9s"
                    repeatCount="indefinite"
                  />
                </feTurbulence>
                <feDisplacementMap in="SourceGraphic" scale="7" />
              </filter>
              <filter id="smoke-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="1.8" />
              </filter>
            </defs>
            <circle className="timer-progress-track" cx="50" cy="50" r="47" />
            <circle
              className="timer-progress-glow"
              cx="50"
              cy="50"
              r="47"
              stroke="url(#smoke-gradient)"
              strokeDasharray={2 * Math.PI * 47}
              strokeDashoffset={2 * Math.PI * 47 * (1 - sessionProgress)}
            />
            <circle
              className="timer-progress-smoke"
              cx="50"
              cy="50"
              r="47"
              stroke="url(#smoke-gradient)"
              strokeDasharray={2 * Math.PI * 47}
              strokeDashoffset={2 * Math.PI * 47 * (1 - sessionProgress)}
            />
          </svg>
        )}
        {!running && (
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
            onChange={(event) => changeDuration(Number(event.target.value))}
            disabled={running}
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
          />
          <button type="button" onClick={applyCustomDuration}>Set</button>
        </div>
        <button className="start-button" type="button" onClick={toggleTimer}>
          {running ? 'Pause' : 'Start focus'}
        </button>
        <button className="reset-button" type="button" onClick={resetTimer}>Reset</button>
      </div>

      <section className="focus-data" aria-label="Today's focus data">
        <div>
          <span className="data-label">Today</span>
          <strong>{focusedToday} min</strong>
        </div>
        <div>
          <span className="data-label">Sessions</span>
          <strong>{todaysSessions.length}</strong>
        </div>
        <div className="latest-task">
          <span className="data-label">Latest completed task</span>
          <strong>{todaysSessions.at(-1)?.task || 'No completed sessions yet'}</strong>
        </div>
      </section>
    </main>
  )
}

export default App
