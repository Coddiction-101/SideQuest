import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import './App.css'

function App() {
  const pageRef = useRef(null)
  const [running, setRunning] = useState(false)
  const [minutes, setMinutes] = useState(25)
  const [secondsLeft, setSecondsLeft] = useState(25 * 60)

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
    }, pageRef)

    return () => context.revert()
  }, [])

  useEffect(() => {
    if (!running) return

    const timer = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          setRunning(false)
          return 0
        }
        return current - 1
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [running])

  const displayMinutes = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const displaySeconds = String(secondsLeft % 60).padStart(2, '0')

  return (
    <main className="focusforge" ref={pageRef}>
      <header className="topbar">
        <a className="brand focusmark" href="/" aria-label="FocusForge home">
          <span className="brand-mark" aria-hidden="true"></span>
          <span>FocusForge</span>
        </a>
        <button className="menu-button" type="button" aria-label="Open menu">Menu</button>
      </header>

      <section className="session-layout" aria-labelledby="session-title">
        <div className="session-copy">
          <p className="session-kicker">Deep work session</p>
          <h1 id="session-title">Make room for<br />what matters.</h1>
          <p className="session-description">
            Choose one task, remove the noise, and stay with it until the timer ends.
          </p>
        </div>

        <div className={`session-ring${running ? ' is-running' : ''}`}>
          <div className="session-ring-inner">
            <span className="session-time">{displayMinutes}:{displaySeconds}</span>
            <span className="session-state">{running ? 'In focus' : 'Ready'}</span>
          </div>
        </div>
      </section>

      <div className="session-controls">
        {[15, 25, 45].map((duration) => (
          <button
            key={duration}
            className={minutes === duration ? 'is-selected' : ''}
            type="button"
            onClick={() => {
              setMinutes(duration)
              setSecondsLeft(duration * 60)
              setRunning(false)
            }}
          >
            {duration} min
          </button>
        ))}
        <button className="start-button" type="button" onClick={() => setRunning((value) => !value)}>
          {running ? 'Pause' : 'Start focus'}
        </button>
      </div>
    </main>
  )
}

export default App
