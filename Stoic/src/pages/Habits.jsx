import { useState } from 'react'
import HabitItem from '../components/HabitItem.jsx'

export default function Habits({ habits, today, onAdd, onToggle, onDelete }) {
  const [name, setName] = useState('')
  return (
    <section aria-labelledby="page-heading">
      <h1 id="page-heading">Habits</h1>
      <form className="section-input" onSubmit={event => {
        event.preventDefault()
        if (!name.trim()) return
        onAdd(name.trim())
        setName('')
      }}>
        <input className="task-input" aria-label="New habit" placeholder="New habit…" value={name} onChange={event => setName(event.target.value)} maxLength={100} enterKeyHint="done" />
      </form>
      <ul className="task-list habit-list">
        {habits.map(habit => <HabitItem key={habit.id} habit={habit} today={today} onToggle={onToggle} onDelete={onDelete} />)}
      </ul>
      <p className="section-note">{habits.length ? 'Tap a habit to mark today complete.' : 'Start small. Add a habit you want to repeat.'}</p>
    </section>
  )
}
