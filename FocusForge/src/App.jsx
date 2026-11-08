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
    const context = gsap.context(() => {
      gsap.from('.focusmark', {
        opacity: 0,
        y: 16,
        duration: 0.6,
        ease: 'power3.out',
      })
      gsap.from('.session-ring, .session-copy', {
        opacity: 0,
        scale: 0.96,
        duration: 0.8,
        delay: 0.15,
        ease: 'power3.out',
        stagger: 0.08,
      })
      gsap.from('.cutout-word span', {
        opacity: 0,
        x: -5,
        y: gsap.utils.wrap([-6, 5]),
        rotation: gsap.utils.wrap([-8, 7]),
        duration: 0.38,
        delay: 0.45,
        stagger: 0.035,
        ease: 'power2.out',
      })
      gsap.from('.cutout-line', {
        scaleX: 0,
        transformOrigin: 'left center',
        duration: 0.55,
        delay: 0.8,
        ease: 'power3.inOut',
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

  return (
    <main className="focusforge" ref={pageRef}>
      <header className="topbar">
        <a className="brand focusmark" href="/" aria-label="FocusForge home">
          <i className="ri-focus-3-line brand-focus-icon" aria-hidden="true"></i>
          <span>FocusForge</span>
        </a>
      </header>

      <section className="session-layout" aria-labelledby="session-title">
        <div className="session-copy">
          <p className="session-kicker">Deep work session</p>
          <div className="headline-wrap">
            <span className="cutout-word" aria-label="Excuses">
              {'Excuses'.split('').map((letter, index) => (
                <span key={`${letter}-${index}`} style={{ '--letter-index': index }}>{letter}</span>
              ))}
              <span className="cutout-line" aria-hidden="true"></span>
            </span>
            <h1 id="session-title">Lock in and get things done, man. :)</h1>
          </div>
          <p className="session-description">
            Pick the task. Kill the noise. Put in the work until it is done.
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

        <div className={`session-ring${running ? ' is-running' : ''}`}>
          <div className="session-ring-inner">
            <span className="session-time">{displayMinutes}:{displaySeconds}</span>
            <span className="session-state">{running ? 'In focus' : 'Ready'}</span>
            <span className="session-task">{task.trim() || 'Choose a task'}</span>
          </div>
        </div>
      </section>

      <div className="session-controls">
        {[15, 25, 45].map((duration) => (
          <button
            key={duration}
            className={minutes === duration ? 'is-selected' : ''}
            type="button"
            onClick={() => chooseDuration(duration)}
          >
            {duration} min
          </button>
        ))}
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
