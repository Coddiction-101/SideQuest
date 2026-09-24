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
  const [openProgress, setOpenProgress] = useState(null)

  const life = profile
    ? lifeProgress(profile.birthDate, profile.lifespan, now)
    : null

  const progressItems = [
    ...timeProgress(now),

    ...(life && !editing
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

  return (
    <section
      className="life-page"
      aria-labelledby="page-heading"
    >
      <h1 id="page-heading">Life</h1>

      <div className="progress-list">
        {progressItems.map(progress => {
          const isOpen = openProgress === progress.label

          return (
            <div
              className={`progress-item ${
                isOpen ? 'progress-item--open' : ''
              }`}
              key={progress.label}
            >
              <button
                className="progress-toggle"
                type="button"
                onClick={() =>
                  setOpenProgress(current =>
                    current === progress.label
                      ? null
                      : progress.label
                  )
                }
                aria-expanded={isOpen}
              >
                <span>{progress.label}</span>

                <span>
                  {Math.floor(progress.percent)}%
                </span>
              </button>

              <div
                className={`progress-content ${
                  isOpen
                    ? 'progress-content--open'
                    : 'progress-content--closed'
                }`}
                aria-hidden={!isOpen}
              >
                <div className="progress-content-inner">
                  <TimeDots
                    {...progress}
                    total={
                      progress.label === 'Today'
                        ? 24
                        : progress.total
                    }
                  />

                  {progress.lifeData && (
                    <div className="life-progress-meta">
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
                          setLifespan(
                            String(profile.lifespan)
                          )
                          setEditing(true)
                          setOpenProgress(null)
                        }}
                      >
                        Edit estimate
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
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
              setOpenProgress('Life')
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
                    setLifespan(
                      String(profile.lifespan)
                    )
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
