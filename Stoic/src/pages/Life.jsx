import { useState } from 'react'
import { lifeProgress, timeProgress } from '../utils/progress.js'
import { localDateKey } from '../utils/dates.js'
import TimeDots from '../components/TimeDots.jsx'

export default function Life({ now, profile, onSave }) {
  const [editing, setEditing] = useState(false)
  const [birthDate, setBirthDate] = useState(profile?.birthDate ?? '')
  const [lifespan, setLifespan] = useState(
    String(profile?.lifespan ?? 80)
  )

  const [activeIndex, setActiveIndex] = useState(0)

  const life = profile
    ? lifeProgress(profile.birthDate, profile.lifespan, now)
    : null

  const progressItems = [
    ...timeProgress(now),

    ...(life
      ? [
          {
            label: 'Life',
            percent: life.percent,
            detail: `${life.elapsedWeeks.toLocaleString()} of ${life.totalWeeks.toLocaleString()} weeks elapsed`,
            elapsed: life.elapsedWeeks,
            total: life.totalWeeks,
            lifeData: true,
          },
        ]
      : []),
  ]

  const activeProgress = progressItems[activeIndex]

  const goPrevious = () => {
    setActiveIndex(current =>
      current === 0
        ? progressItems.length - 1
        : current - 1
    )
  }

  const goNext = () => {
    setActiveIndex(current =>
      current === progressItems.length - 1
        ? 0
        : current + 1
    )
  }

  return (
    <section
      className="life-page"
      aria-labelledby="page-heading"
    >
      <h1 id="page-heading">Life</h1>

      <div className="life-viewer">
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
                activeIndex === index
                  ? 'life-scale-tab--active'
                  : ''
              }`}
              role="tab"
              aria-selected={activeIndex === index}
              onClick={() => setActiveIndex(index)}
            >
              {progress.label}
            </button>
          ))}
        </div>

        {activeProgress && (
          <div
            className="life-stage"
            key={activeProgress.label}
          >
            <div className="life-stage-header">
              <span>{activeProgress.label}</span>

              <span>
                {Math.floor(activeProgress.percent)}%
              </span>
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
            {activeIndex + 1} / {progressItems.length}
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

      {(!profile || editing) && (
        <section
          className="life-section"
          aria-labelledby="life-progress-heading"
        >
          <div className="life-heading">
            <h2 id="life-progress-heading">
              Life estimate
            </h2>
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
            <p className="section-note">
              Add two details for your personal time estimate.
            </p>

            <label>
              Date of birth

              <input
                type="date"
                required
                max={localDateKey(new Date(now))}
                min="1900-01-01"
                value={birthDate}
                onChange={event =>
                  setBirthDate(event.target.value)
                }
              />
            </label>

            <label>
              Expected lifespan{' '}
              <span className="muted">
                (years)
              </span>

              <input
                type="number"
                min="1"
                max="150"
                step="1"
                required
                value={lifespan}
                onChange={event =>
                  setLifespan(event.target.value)
                }
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
        </section>
      )}
    </section>
  )
}
