export default function TimeDots({
  label,
  percent,
  detail,
  total = 24,
  elapsed,
}) {
  const completed =
    typeof elapsed === 'nuexport default function TimeDots({
  label,
  percent,
  detail,
  total = 24,
  elapsed,
}) {
  const completed =
    typeof elapsed === 'number'
      ? elapsed
      : Math.floor((percent / 100) * total)

  const isYear = label === 'Year'
  const isLife = label === 'Life'

  const getElapsedOpacity = index => {
    if (completed <= 1) return 1

    const position = index / (completed - 1)

    // Oldest = strongest
    // Most recent elapsed = softer
    return 1 - position * 0.48
  }

  return (
    <div className="time-dots-row">
      <div className="progress-heading">
        <span>{label}</span>
        <span>{Math.floor(percent)}%</span>
      </div>

      <div
        className={`time-dots ${
          isYear
            ? 'time-dots--year'
            : isLife
              ? 'time-dots--life'
              : ''
        }`}
        role="progressbar"
        aria-label={`${label} elapsed`}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={completed}
      >
        {Array.from({ length: total }, (_, index) => {
          const isElapsed = index < completed

          return (
            <span
              key={index}
              className={`time-dot ${
                isElapsed ? 'time-dot--elapsed' : ''
              }`}
              style={
                isElapsed
                  ? { opacity: getElapsedOpacity(index) }
                  : undefined
              }
            />
          )
        })}
      </div>

      <p>{detail}</p>
    </div>
  )
}mber'
      ? elapsed
      : Math.floor((percent / 100) * total)

  const isYear = label === 'Year'
  const isLife = label === 'Life'

  const getShadeClass = index => {
    if (index >= completed || completed === 0) {
      return ''
    }

    const progress = index / completed

    if (progress < 0.16) return 'time-dot--shade-1'
    if (progress < 0.33) return 'time-dot--shade-2'
    if (progress < 0.5) return 'time-dot--shade-3'
    if (progress < 0.66) return 'time-dot--shade-4'
    if (progress < 0.83) return 'time-dot--shade-5'

    return 'time-dot--shade-6'
  }

  return (
    <div className="time-dots-row">
      <div className="progress-heading">
        <span>{label}</span>
        <span>{Math.floor(percent)}%</span>
      </div>

      <div
        className={`time-dots ${
          isYear
            ? 'time-dots--year'
            : isLife
              ? 'time-dots--life'
              : ''
        }`}
        role="progressbar"
        aria-label={`${label} elapsed`}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={completed}
      >
        {Array.from({ length: total }, (_, index) => {
          const isElapsed = index < completed

          return (
            <span
              key={index}
              className={`time-dot ${
                isElapsed ? getShadeClass(index) : ''
              }`}
            />
          )
        })}
      </div>

      <p>{detail}</p>
    </div>
  )
}
