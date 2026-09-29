import { useRef, useState } from 'react'
import { timeProgress } from '../utils/progress.js'
import TimeDots from '../components/TimeDots.jsx'

export default function Life({ now }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const touchStart = useRef(null)
  const progressItems = timeProgress(now)
  const progress = progressItems[activeIndex]
  function select(index, focus = false) {
    const next = (index + progressItems.length) % progressItems.length
    setActiveIndex(next)
    if (focus) document.getElementById(`scale-${next}`)?.focus()
  }
  return (
    <section className="life-page" aria-labelledby="page-heading">
      <h1 id="page-heading">Time</h1>
      <div className="life-viewer">
        <div className="life-scale-tabs" role="tablist" aria-label="Time progress">
          {progressItems.map((item, index) => <button key={item.label} id={`scale-${index}`} type="button"
            className={`life-scale-tab ${activeIndex === index ? 'life-scale-tab--active' : ''}`}
            role="tab" aria-selected={activeIndex === index} aria-controls="time-panel" tabIndex={activeIndex === index ? 0 : -1}
            onClick={() => select(index)} onKeyDown={event => {
              const next = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: progressItems.length - 1 }[event.key]
              if (next !== undefined) { event.preventDefault(); select(next, true) }
            }}>{item.label}</button>)}
        </div>
        <div className="life-stage" id="time-panel" role="tabpanel" aria-labelledby={`scale-${activeIndex}`} tabIndex={0}
          onTouchStart={event => { const touch = event.changedTouches[0]; touchStart.current = touch ? { x: touch.clientX, y: touch.clientY } : null }}
          onTouchCancel={() => { touchStart.current = null }}
          onTouchEnd={event => {
            const start = touchStart.current, end = event.changedTouches[0]
            touchStart.current = null
            if (!start || !end) return
            const dx = end.clientX - start.x, dy = end.clientY - start.y
            if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5) select(activeIndex + (dx < 0 ? 1 : -1))
          }}>
          <div className="life-stage-header"><span>{progress.label}</span><span>{Math.floor(progress.percent)}%</span></div>
          <div className="life-stage-visual" key={progress.label}>
            <TimeDots label={progress.label} detail={progress.detail} total={progress.total ?? 24}
              elapsed={progress.elapsed ?? Math.floor(progress.percent / 100 * 24)} />
          </div>
        </div>
        <div className="life-slider-controls">
          <button type="button" onClick={() => select(activeIndex - 1)} aria-label="Previous time scale">←</button>
          <span>{activeIndex + 1} / {progressItems.length}</span>
          <button type="button" onClick={() => select(activeIndex + 1)} aria-label="Next time scale">→</button>
        </div>
      </div>
    </section>
  )
}
