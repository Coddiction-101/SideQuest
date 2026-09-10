import { currentStreak } from '../utils/dates.js'
import ItemActions from './ItemActions.jsx'

export default function HabitItem({ habit, today, onToggle, onDelete, compact = false }) {
  const completed = habit.completions.includes(today)
  const streak = currentStreak(habit.completions, today)
  return (
    <li className={`task-row habit-row ${compact ? 'compact' : ''}`}>
      <label className="task-label">
        <input type="checkbox" checked={completed} onChange={() => onToggle(habit.id)} />
        <span className={completed ? 'task-done' : ''}>{habit.name}</span>
      </label>
      {!compact && <>
        <span className="streak" aria-label={`Current streak: ${streak} ${streak === 1 ? 'day' : 'days'}`}>{streak} {streak === 1 ? 'day' : 'days'}</span>
        <ItemActions name={habit.name}>
          <button type="button" onClick={() => onDelete(habit.id)}>Delete habit</button>
        </ItemActions>
      </>}
    </li>
  )
}
