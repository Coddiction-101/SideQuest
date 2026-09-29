import { memo } from 'react'

function TimeDots({ label, detail, total, elapsed }) {
  const completed = Math.max(0, Math.min(total, elapsed))
  return <div className="time-dots-row">
    <div className={`time-dots ${label === 'Year' ? 'time-dots--year' : ''}`} role="progressbar"
      aria-label={`${label} elapsed`} aria-valuemin={0} aria-valuemax={total} aria-valuenow={completed} aria-valuetext={detail}>
      {Array.from({ length: total }, (_, index) => <span key={index} aria-hidden="true"
        className={`time-dot ${index < completed ? 'time-dot--elapsed' : ''}`}
        style={index < completed ? { opacity: completed <= 1 ? 1 : 1 - index / (completed - 1) * 0.48 } : undefined} />)}
    </div>
    <p>{detail}</p>
  </div>
}
export default memo(TimeDots)
