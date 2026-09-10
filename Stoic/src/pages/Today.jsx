import { useState } from 'react'
import { moveTask, reorderTask } from '../utils/tasks.js'
import HabitItem from '../components/HabitItem.jsx'
import ItemActions from '../components/ItemActions.jsx'

export default function Today({ today, now, tasks, updateTasks, deleteTask, habits, toggleHabit, onNavigate }) {
  const [taskInput, setTaskInput] = useState('')
  const [dragId, setDragId] = useState(null)
  const [dropId, setDropId] = useState(null)
  const hour = new Date(now).getHours()
  const greeting = hour < 5 || hour >= 22 ? 'Good night.' : hour < 12 ? 'Good morning.' : hour < 17 ? 'Good afternoon.' : 'Good evening.'
  const completedCount = tasks.filter(task => task.completed).length
  return (
    <section className="today-page" aria-labelledby="page-heading">
      <div className="today-content">
      <p className="today-date"><time dateTime={today}>{new Date(`${today}T12:00:00`).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</time></p>
      <h1 id="page-heading">{greeting}</h1>
      <div className="today">
        <p className="task-count" aria-live="polite"><strong>{completedCount} of {tasks.length}</strong> completed<span className="sr-only">, {tasks.length - completedCount} remaining</span></p>
        <form onSubmit={event => {
          event.preventDefault()
          const text = taskInput.trim()
          if (!text) return
          const task = { id: crypto.randomUUID(), text, completed: false }
          updateTasks(current => [...current, task])
          setTaskInput('')
        }}>
          <input className="task-input" aria-label="New task" placeholder="What needs to be done?" value={taskInput} onChange={event => setTaskInput(event.target.value)} maxLength={200} enterKeyHint="done" />
        </form>
        {!tasks.length && <p className="empty-state">Your day is clear. Add something you want to do.</p>}
        <ul className="task-list">
          {tasks.map((task, index) => (
            <li className={`task-row ${dropId === task.id ? 'drop-target' : ''} ${dragId === task.id ? 'dragging' : ''}`} key={task.id}
              onDragOver={event => { if (dragId && dragId !== task.id) { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; setDropId(task.id) } }}
              onDrop={event => { event.preventDefault(); if (dragId) updateTasks(current => reorderTask(current, dragId, task.id)); setDragId(null); setDropId(null) }}>
              <button className="drag-handle" type="button" draggable aria-label={`Reorder ${task.text}; use arrow keys to move`} title="Drag to reorder, or use arrow keys"
                onDragStart={event => { setDragId(task.id); event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', task.id) }}
                onDragEnd={() => { setDragId(null); setDropId(null) }}
                onKeyDown={event => { if (event.key === 'ArrowUp' || event.key === 'ArrowDown') { event.preventDefault(); updateTasks(current => moveTask(current, task.id, event.key === 'ArrowUp' ? -1 : 1)) } }}>
                <svg width="12" height="18" viewBox="0 0 12 18" fill="currentColor" aria-hidden="true">{[4, 9, 14].map(y => <g key={y}><circle cx="4" cy={y} r="1" /><circle cx="8" cy={y} r="1" /></g>)}</svg>
              </button>
              <label className="task-label">
                <input type="checkbox" checked={task.completed} onChange={() => updateTasks(current => current.map(item => item.id === task.id ? { ...item, completed: !item.completed } : item))} />
                <span className={task.completed ? 'task-done' : ''}>{task.text}</span>
              </label>
              <ItemActions name={task.text}>
                <button type="button" disabled={index === 0} onClick={() => updateTasks(current => moveTask(current, task.id, -1))}>Move up</button>
                <button type="button" disabled={index === tasks.length - 1} onClick={() => updateTasks(current => moveTask(current, task.id, 1))}>Move down</button>
                <button type="button" onClick={() => deleteTask(task.id)}>Delete task</button>
              </ItemActions>
            </li>
          ))}
        </ul>
      </div>
      </div>
      <div className="today-sidebar">
      <section className="today-preview" aria-labelledby="habits-preview-heading">
        <h2 id="habits-preview-heading"><button className="section-link" onClick={() => onNavigate('Habits')}>Habits</button></h2>
        {habits.length ? <ul className="task-list preview-list">{habits.slice(0, 3).map(habit => <HabitItem key={habit.id} habit={habit} today={today} onToggle={toggleHabit} compact />)}</ul>
          : <button className="text-button" onClick={() => onNavigate('Habits')}>Add your first habit <span aria-hidden="true">↗</span></button>}
        {habits.length > 3 && <button className="text-button" onClick={() => onNavigate('Habits')}>View all {habits.length} habits</button>}
      </section>
      </div>
    </section>
  )
}
