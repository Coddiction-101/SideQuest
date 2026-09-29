import { useState } from 'react'
import { countdownParts, formatClock } from '../utils/time.js'

function DurationForm({ clock }) {
  const [minutes, setMinutes] = useState(
    String(clock.timer.duration / 60000)
  )

  return (
    <details className="duration-settings">
      <summary>Set duration</summary>

      <form
        className="inline-form"
        onSubmit={event => {
          event.preventDefault()
          clock.setDuration(Number(minutes))
          event.currentTarget.closest('details').open = false
        }}
      >
        <label>
          Minutes
          <input
            type="number"
            min="1"
            max="1440"
            step="1"
            required
            value={minutes}
            onChange={event => setMinutes(event.target.value)}
            disabled={clock.running}
          />
        </label>

        <button
          className="soft-button"
          disabled={clock.running}
        >
          Set
        </button>
      </form>
    </details>
  )
}

const DAY = 86400000

function startOfDay(value) {
  const date = new Date(value)
  date.setHours(0, 0, 0, 0)
  return date
}

function daysBetween(start, end) {
  const from = startOfDay(start)
  const to = startOfDay(end)

  return Math.max(
    0,
    Math.ceil((to - from) / DAY)
  )
}

export default function Clock({
  clock,
  now,
  sound,
  onToggleSound,
  previewSound,
}) {
  const [soundError, setSoundError] = useState('')

  /*
    Keep "Countdown" internally so the existing clock hook
    does not need to change yet.
  */
  const modes = ['Timer', 'Countdown', 'Stopwatch']

  const modeLabels = {
    Timer: 'Timer',
    Countdown: 'Moments',
    Stopwatch: 'Stopwatch',
  }

  /*
    Moments
  */
  const [momentType, setMomentType] = useState('Until')
  const [momentTitle, setMomentTitle] = useState('Last 100 Days')
  const [momentStart, setMomentStart] = useState('')
  const [sinceDate, setSinceDate] = useState('')

  const targetTime = clock.target
    ? new Date(clock.target).getTime()
    : null

  const countdown =
    targetTime === null
      ? [0, 0, 0, 0]
      : countdownParts(targetTime, now)

  const stopwatchRunning =
    clock.stopwatch.startedAt !== null

  /*
    UNTIL calculations
  */
  const untilTarget =
    targetTime !== null
      ? new Date(targetTime)
      : null

  const untilStart =
    momentStart
      ? new Date(`${momentStart}T00:00`)
      : null

  const totalDays =
    untilStart && untilTarget
      ? daysBetween(untilStart, untilTarget)
      : 0

  const remainingDays =
    untilTarget
      ? daysBetween(now, untilTarget)
      : 0

  const elapsedDays =
    totalDays > 0
      ? Math.max(
          0,
          Math.min(
            totalDays,
            totalDays - remainingDays
          )
        )
      : 0

  const momentPercent =
    totalDays > 0
      ? Math.min(
          100,
          Math.max(
            0,
            (elapsedDays / totalDays) * 100
          )
        )
      : 0

  /*
    SINCE calculations
  */
  const daysSince =
    sinceDate
      ? daysBetween(
          new Date(`${sinceDate}T00:00`),
          now
        )
      : 0

  return (
    <section
      className="clock-page"
      aria-labelledby="page-heading"
    >
      <h1
        id="page-heading"
        className="sr-only"
      >
        Clock
      </h1>

      <div
        className="segmented-control"
        role="tablist"
        aria-label="Clock mode"
      >
        {modes.map((mode, index) => (
          <button
            key={mode}
            role="tab"
            id={`tab-${mode}`}
            aria-controls={`panel-${mode}`}
            aria-selected={clock.mode === mode}
            tabIndex={clock.mode === mode ? 0 : -1}
            onClick={() => clock.setMode(mode)}
            onKeyDown={event => {
              let next

              if (event.key === 'ArrowRight') {
                next = (index + 1) % modes.length
              }

              if (event.key === 'ArrowLeft') {
                next =
                  (index + modes.length - 1) %
                  modes.length
              }

              if (event.key === 'Home') next = 0
              if (event.key === 'End') {
                next = modes.length - 1
              }

              if (next !== undefined) {
                event.preventDefault()
                clock.setMode(modes[next])

                document
                  .getElementById(
                    `tab-${modes[next]}`
                  )
                  ?.focus()
              }
            }}
          >
            {modeLabels[mode]}
          </button>
        ))}
      </div>

      <div
        className="clock-panel"
        role="tabpanel"
        id={`panel-${clock.mode}`}
        aria-labelledby={`tab-${clock.mode}`}
      >
        {clock.mode === 'Timer' && (
          <>
            <div className="clock-stage">
              <span
                className={`clock-time ${
                  formatClock(
                    clock.remaining,
                    true
                  ).length > 5
                    ? 'long-time'
                    : ''
                }`}
                role="timer"
                aria-label="Time remaining"
              >
                {formatClock(
                  clock.remaining,
                  true
                )}
              </span>
            </div>

            <div className="clock-controls">
              <button
                className="soft-button"
                onClick={clock.toggleTimer}
              >
                {clock.running
                  ? 'Pause'
                  : clock.remaining === 0
                    ? 'Start again'
                    : clock.remaining <
                        clock.timer.duration
                      ? 'Resume'
                      : 'Start'}
              </button>

              <button
                className="soft-button"
                onClick={clock.resetTimer}
              >
                Reset
              </button>
            </div>

            <p className="clock-caption">
              {clock.timer.duration / 60000}{' '}
              minute focus session
            </p>

            <DurationForm clock={clock} />

            <div className="sound-controls">
              <label>
                <input
                  type="checkbox"
                  checked={sound}
                  onChange={onToggleSound}
                />
                Completion sound
              </label>

              {sound && (
                <button
                  className="text-button"
                  onClick={async () => {
                    setSoundError(
                      (await previewSound())
                        ? ''
                        : 'Sound is unavailable in this browser.'
                    )
                  }}
                >
                  Preview
                </button>
              )}
            </div>

            {sound && (
              <p className="sound-note">
                Plays while Stoic is open.
              </p>
            )}

            {soundError && (
              <p
                className="sound-note"
                role="status"
              >
                {soundError}
              </p>
            )}
          </>
        )}

        {clock.mode === 'Stopwatch' && (
          <>
            <div className="clock-stage">
              <span
                className={`clock-time ${
                  formatClock(
                    clock.elapsed
                  ).length > 5
                    ? 'long-time'
                    : ''
                }`}
                role="timer"
                aria-label="Elapsed time"
              >
                {formatClock(clock.elapsed)}
              </span>
            </div>

            <div className="clock-controls">
              <button
                className="soft-button"
                onClick={
                  clock.toggleStopwatch
                }
              >
                {stopwatchRunning
                  ? 'Pause'
                  : clock.elapsed > 0
                    ? 'Resume'
                    : 'Start'}
              </button>

              <button
                className="soft-button"
                onClick={
                  clock.resetStopwatch
                }
              >
                Reset
              </button>
            </div>

            <p className="clock-caption">
              One thing at a time.
            </p>
          </>
        )}

        {clock.mode === 'Countdown' && (
          <section className="moments">
            <div
              className="moment-type-switch"
              role="tablist"
              aria-label="Moment type"
            >
              {['Until', 'Since'].map(type => (
                <button
                  key={type}
                  type="button"
                  role="tab"
                  aria-selected={
                    momentType === type
                  }
                  className={
                    momentType === type
                      ? 'moment-type-active'
                      : ''
                  }
                  onClick={() =>
                    setMomentType(type)
                  }
                >
                  {type}
                </button>
              ))}
            </div>

            {momentType === 'Until' && (
              <>
                {targetTime !== null ? (
                  <div className="moment-stage">
                    <p className="moment-kicker">
                      {momentTitle ||
                        'Your moment'}
                    </p>

                    <strong className="moment-number">
                      {remainingDays}
                    </strong>

                    <p className="moment-unit">
                      {remainingDays === 1
                        ? 'day remaining'
                        : 'days remaining'}
                    </p>

                    {totalDays > 0 && (
                      <>
                        <div className="moment-dots">
                          {Array.from({
                            length: Math.min(
                              totalDays,
                              100
                            ),
                          }).map(
                            (_, index) => {
                              const visibleTotal =
                                Math.min(
                                  totalDays,
                                  100
                                )

                              const filled =
                                Math.round(
                                  (momentPercent /
                                    100) *
                                    visibleTotal
                                )

                              return (
                                <span
                                  key={index}
                                  className={
                                    index < filled
                                      ? 'moment-dot moment-dot--elapsed'
                                      : 'moment-dot'
                                  }
                                />
                              )
                            }
                          )}
                        </div>

                        <p className="moment-progress-copy">
                          Day{' '}
                          {Math.min(
                            elapsedDays + 1,
                            totalDays
                          )}{' '}
                          of {totalDays}
                        </p>
                      </>
                    )}

                    <div
                      className="moment-exact-time"
                      aria-label="Exact time remaining"
                    >
                      {countdown.map(
                        (value, index) => (
                          <span key={index}>
                            {String(
                              value
                            ).padStart(2, '0')}
                            <small>
                              {
                                [
                                  'd',
                                  'h',
                                  'm',
                                  's',
                                ][index]
                              }
                            </small>
                          </span>
                        )
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="moment-empty">
                    <h2>
                      Count toward something.
                    </h2>

                    <p>
                      Give a future moment a
                      name and let Stoic show
                      you the distance.
                    </p>
                  </div>
                )}

                <div className="moment-form">
                  <label>
                    Name
                    <input
                      type="text"
                      maxLength="60"
                      placeholder="Get a job"
                      value={momentTitle}
                      onChange={event =>
                        setMomentTitle(
                          event.target.value
                        )
                      }
                    />
                  </label>

                  <label>
                    Start date
                    <input
                      type="date"
                      value={momentStart}
                      onChange={event =>
                        setMomentStart(
                          event.target.value
                        )
                      }
                    />
                  </label>

                  <label>
                    Target
                    <input
                      aria-label="Moment target"
                      type="datetime-local"
                      value={clock.target}
                      onChange={event =>
                        clock.setTarget(
                          event.target.value
                        )
                      }
                    />
                  </label>
                </div>

                {clock.target && (
                  <button
                    className="text-button countdown-clear"
                    onClick={() =>
                      clock.setTarget('')
                    }
                  >
                    Clear moment
                  </button>
                )}
              </>
            )}

            {momentType === 'Since' && (
              <>
                {sinceDate ? (
                  <div className="moment-stage">
                    <p className="moment-kicker">
                      {momentTitle ||
                        'Your moment'}
                    </p>

                    <strong className="moment-number">
                      {daysSince}
                    </strong>

                    <p className="moment-unit">
                      {daysSince === 1
                        ? 'day since'
                        : 'days since'}
                    </p>

                    <p className="moment-progress-copy">
                      Since{' '}
                      {new Date(
                        `${sinceDate}T00:00`
                      ).toLocaleDateString(
                        undefined,
                        {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        }
                      )}
                    </p>
                  </div>
                ) : (
                  <div className="moment-empty">
                    <h2>
                      Remember when it began.
                    </h2>

                    <p>
                      Track how much time has
                      passed since something
                      changed.
                    </p>
                  </div>
                )}

                <div className="moment-form">
                  <label>
                    Name
                    <input
                      type="text"
                      maxLength="60"
                      placeholder="Started running"
                      value={momentTitle}
                      onChange={event =>
                        setMomentTitle(
                          event.target.value
                        )
                      }
                    />
                  </label>

                  <label>
                    Since
                    <input
                      type="date"
                      value={sinceDate}
                      max={
                        new Date(now)
                          .toISOString()
                          .split('T')[0]
                      }
                      onChange={event =>
                        setSinceDate(
                          event.target.value
                        )
                      }
                    />
                  </label>
                </div>
              </>
            )}
          </section>
        )}
      </div>
    </section>
  )
}
