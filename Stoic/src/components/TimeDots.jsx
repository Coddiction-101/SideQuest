export default function TimeDots({
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

  return (
    <div className="time-dots-row">
      <div className="progress-heading">
        <span>{label}</span>
        <span>{Math.floor(percent)}%</span>
      </div>

      <div
        className={`time-dots ${isYear ? 'time-dots--year' : ''}`}
        role="progressbar"
        aria-label={`${label} elapsed`}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={completed}
      >
        {Array.from({ length: total }, (_, index) => (
          <span
            key={index}
            className={`time-dot ${
              index < completed ? 'time-dot--elapsed' : ''
            }`}
          />
        ))}
      </div>

      <p>{detail}</p>
    </div>
  )
}
