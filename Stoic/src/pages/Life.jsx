import { useEffect, useRef, useState } from 'react'
import anime from 'animejs/lib/anime.es.js'
import { lifeProgress, timeProgress } from '../utils/progress.js'
import { localDateKey } from '../utils/dates.js'
import TimeDots from '../components/TimeDots.jsx'

export default function Life({ now, profile, onSave }) {
  const [editing, setEditing] = useState(false)
  const [birthDate, setBirthDate] = useState(profile?.birthDate ?? '')
  const [lifespan, setLifespan] = useState(String(profile?.lifespan ?? 80))
  const [activeIndex, setActiveIndex] = useState(0)

  const stageRef = useRef(null)
  const touchStartX = useRef(null)

  const life = profile
    ? lifeProgress(profile.birthDate, profile.lifespan, now)
    : null

  const lifeItem = life
    ? {
        label: 'Life',
        percent: life.percent,
        detail: `${life.elapsedWeeks.toLocaleString()} of ${life.totalWeeks.toLocaleString()} weeks elapsed`,
        elapsed: life.elapsedWeeks,
        total: life.totalWeeks,
        lifeData: true,
      }
    : {
        label: 'Life',
        percent: 0,
        detail: '',
        total: 0,
        setupRequired: true,
      }

  const progressItems = [
    ...timeProgress(now),
    lifeItem,
  ]

  const safeIndex = Math.min(activeIndex, progressItems.length - 1)
  const activeProgress = progressItems[safeIndex]
  const showingLifeSetup =
    activeProgress?.label === 'Life' && (!profile || editing)

  const selectIndex = index => {
    setActiveIndex(index)

    if (progressItems[index]?.label !== 'Life' && editing) {
      setEditing(false)
      setBirthDate(profile?.birthDate ?? '')
      setLifespan(String(profile?.lifespan ?? 80))
    }
  }

  const goPrevious = () => {
    setActiveIndex(current =>
      current === 0 ? progressItems.length - 1 : current - 1
    )
  }

  const goNext = () => {
    setActiveIndex(current =>
      current === progressItems.length - 1 ? 0 : current + 1
    )
  }

  useEffect(() => {
    if (!stageRef.current || !activeProgress || showingLifeSetup) return

    const reduceMotion =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reduceMotion) return

    const stage = stageRef.current
    const dots = stage.querySelectorAll('.time-dot')
    const detail = stage.querySelector('.time-dots-row > p')
    const percentage = stage.querySelector(
      '.life-stage-header span:last-child'
    )

    anime.remove([stage, dots, detail, percentage])

    anime({
      targets: stage,
      opacity: [0, 1],
      translateX: [10, 0],
      duration: 300,
      easing: 'easeOutCubic',
    })

    if (percentage) {
      anime({
        targets: percentage,
        opacity: [0, 1],
        translateY: [6, 0],
        duration: 260,
        easing: 'easeOutCubic',
      })
    }

    if (activeProgress.label !== 'Life' && dots.length) {
      anime({
        targets: dots,
        opacity: (_, index) => {
          const inlineOpacity = Number(dots[index]?.style?.opacity)
          const finalOpacity =
            Number.isFinite(inlineOpacity) && inlineOpacity > 0
              ? inlineOpacity
              : 1

          return [0, finalOpacity]
        },
        scale: [0.86, 1],
        delay: anime.stagger(6, { start: 30 }),
        duration: 240,
        easing: 'easeOutQuad',
      })
    }

    if (detail) {
      anime({
        targets: detail,
        opacity: [0, 1],
        translateY: [5, 0],
        delay: 80,
        duration: 240,
        easing: 'easeOutCubic',
      })
    }
  }, [activeProgress?.label, showingLifeSetup])

  const handleTouchStart = event => {
    touchStartX.current = event.changedTouches[0]?.clientX ?? null
  }

  const handleTouchEnd = event => {
    if (touchStartX.current == null) return

    const endX = event.changedTouches[0]?.clientX ?? touchStartX.current
    const distance = endX - touchStartX.current

    touchStartX.current = null

    if (Math.abs(distance) < 45) return

    if (distance < 0) {
      goNext()
    } else {
      goPrevious()
    }
  }

  return (
    <section className="life-page" aria-labelledby="page-heading">
      <h1 id="page-heading">Life</h1>

      <div
        className="life-viewer"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="life-scale-tabs"
          role="tablist"
          aria-label="Time progress"
        >
          {progressItems.map((progress, index) => (
            <button
              key={progress.label}
              type="button"
              className={`life-scale-tab ${
                safeIndex === index ? 'life-scale-tab--active' : ''
              }`}
              role="tab"
              aria-selected={safeIndex === index}
              onClick={() => selectIndex(index)}
            >
              {progress.label}
            </button>
          ))}
        </div>

        {showingLifeSetup ? (
          <div className="life-stage" ref={stageRef}>
            <div className="life-setup">
              <div className="life-setup-intro">
                <h2>Life estimate</h2>
                <p>Add two details to visualize your weeks.</p>
              </div>

              <form
                className="life-form"
                onSubmit={event => {
                  event.preventDefault()

                  if (
                    !birthDate ||
                    birthDate > localDateKey(new Date(now))
                  ) {
                    return
                  }

                  onSave({
                    birthDate,
                    lifespan: Number(lifespan),
                  })

                  setEditing(false)
                }}
              >
                <label>
                  Date of birth
                  <input
                    type="date"
                    required
                    max={localDateKey(new Date(now))}
                    min="1900-01-01"
                    value={birthDate}
                    onChange={event => setBirthDate(event.target.value)}
                  />
                </label>

                <label>
                  Expected lifespan{' '}
                  <span className="muted">(years)</span>
                  <input
                    type="number"
                    min="1"
                    max="150"
                    step="1"
                    required
                    value={lifespan}
                    onChange={event => setLifespan(event.target.value)}
                  />
                </label>

                <div className="life-form-actions">
                  <button className="soft-button">
                    Save estimate
                  </button>

                  {profile && (
                    <button
                      className="text-button"
                      type="button"
                      onClick={() => {
                        setBirthDate(profile.birthDate)
                        setLifespan(String(profile.lifespan))
                        setEditing(false)
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </div>

                <p className="estimate-note">
                  An estimate, not a prediction. These details stay on this device.
                </p>
              </form>
            </div>
          </div>
        ) : (
          <div
            className="life-stage"
            key={activeProgress.label}
            ref={stageRef}
          >
            <div className="life-stage-header">
              <span>{activeProgress.label}</span>
              <span>{Math.floor(activeProgress.percent)}%</span>
            </div>

            <div className="life-stage-visual">
              <TimeDots
                {...activeProgress}
                total={
                  activeProgress.label === 'Today'
                    ? 24
                    : activeProgress.total
                }
              />
            </div>

            {activeProgress.lifeData && (
              <div className="life-stage-meta">
                <p className="life-age">
                  Age {life.age} · {profile.lifespan} year estimate
                </p>

                <p className="estimate-note">
                  An estimate, not a prediction.
                </p>

                <button
                  className="text-button"
                  type="button"
                  onClick={() => {
                    setBirthDate(profile.birthDate)
                    setLifespan(String(profile.lifespan))
                    setEditing(true)
                  }}
                >
                  Edit estimate
                </button>
              </div>
            )}
          </div>
        )}

        <div className="life-slider-controls">
          <button
            type="button"
            onClick={goPrevious}
            aria-label="Previous time scale"
          >
            ←
          </button>

          <span>
            {safeIndex + 1} / {progressItems.length}
          </span>

          <button
            type="button"
            onClick={goNext}
            aria-label="Next time scale"
          >
            →
          </button>
        </div>
      </div>
    </section>
  )
}
