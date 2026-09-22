export default function TimeDots({
  label,
  percent,
  detail,
  total = 24,
}) {
  const completed = Math.floor((percent / 100) * total)

  return (
    <div className="time-dots-row">
      <div className="progress-heading">
        <span>{label}</span>
        <span>{Math.floor(percent)}%</span>
      </div>

      <div
        className="time-dots"
        role="progressbar"
        aria-label={`${label} elapsed`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.floor(percent)}
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
