import { useState } from 'react'
import { lifeProgress, timeProgress } from '../utils/progress.js'
import { localDateKey } from '../utils/dates.js'
import ProgressBar from '../components/ProgressBar.jsx'

export default function Life({ now, profile, onSave }) {
  const [editing, setEditing] = useState(false)
  const [birthDate, setBirthDate] = useState(profile?.birthDate ?? '')
  const [lifespan, setLifespan] = useState(String(profile?.lifespan ?? 80))
  const life = profile ? lifeProgress(profile.birthDate, profile.lifespan, now) : null
  return (
    <section className="life-page" aria-labelledby="page-heading">
      <h1 id="page-heading">Life</h1>
      <div className="progress-list">{timeProgress(now).map(progress => <ProgressBar key={progress.label} {...progress} />)}</div>
      <section className="life-section" aria-labelledby="life-progress-heading">
        <div className="life-heading"><h2 id="life-progress-heading">Life</h2>{profile && !editing && <button className="text-button" onClick={() => setEditing(true)}>Edit</button>}</div>
        {life && !editing ? <div className="life-estimate">
          <div className="life-ring" role="progressbar" aria-label="Estimated life elapsed" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.floor(life.percent)}>
            <svg viewBox="0 0 100 100" aria-hidden="true"><circle className="ring-track" cx="50" cy="50" r="45" /><circle className="ring-value" cx="50" cy="50" r="45" pathLength="100" strokeDasharray={`${life.percent} 100`} /></svg>
            <span>{Math.floor(life.percent)}%</span>
          </div>
          <div><p className="life-age">Age {life.age} · {profile.lifespan} year estimate</p><p className="estimate-note">An estimate, not a prediction.</p></div>
        </div> : <form className="life-form" onSubmit={event => {
          event.preventDefault()
          if (!birthDate || birthDate > localDateKey(new Date(now))) return
          onSave({ birthDate, lifespan: Number(lifespan) })
          setEditing(false)
        }}>
          <p className="section-note">Add two details for your personal time estimate.</p>
          <label>Date of birth<input type="date" required max={localDateKey(new Date(now))} min="1900-01-01" value={birthDate} onChange={event => setBirthDate(event.target.value)} /></label>
          <label>Expected lifespan <span className="muted">(years)</span><input type="number" min="1" max="150" step="1" required value={lifespan} onChange={event => setLifespan(event.target.value)} /></label>
          <div className="life-form-actions"><button className="soft-button">Save estimate</button>{profile && <button className="text-button" type="button" onClick={() => { setBirthDate(profile.birthDate); setLifespan(String(profile.lifespan)); setEditing(false) }}>Cancel</button>}</div>
          <p className="estimate-note">An estimate, not a prediction. These details stay on this device.</p>
        </form>}
      </section>
    </section>
  )
}
