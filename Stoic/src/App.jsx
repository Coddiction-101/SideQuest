import { useEffect, useState } from 'react'
import { useNow } from './hooks/useNow.js'
import { useStoredState } from './hooks/useStoredState.js'
import { useClock } from './hooks/useClock.js'
import { initialData, validData } from './storage/data.js'
import { localDateKey } from './utils/dates.js'
import Navigation from './components/Navigation.jsx'
import Today from './pages/Today.jsx'
import Habits from './pages/Habits.jsx'
import Clock from './pages/Clock.jsx'
import Life from './pages/Life.jsx'
import AppMenu from './components/AppMenu.jsx'
import { useInstall } from './hooks/useInstall.js'
import { useChime } from './hooks/useChime.js'
import { mergeBackup } from './storage/backup.js'
import { restoreItem } from './utils/tasks.js'

export default function App() {
  const [activePage, setActivePage] = useState('Today')
  const [data, setData, storageError, allowSaving] = useStoredState('stoic.data.v1', initialData, validData)
  const now = useNow()
  const today = localDateKey(new Date(now))
  const clock = useClock(now)
  const install = useInstall()
  const chime = useChime(Boolean(data.sound), clock.timer.endsAt, clock.remaining)
  const [undo, setUndo] = useState(null)
  const [undoPaused, setUndoPaused] = useState(false)

  useEffect(() => {
    if (!undo || undoPaused) return
    const timeout = setTimeout(() => setUndo(null), 15000)
    return () => clearTimeout(timeout)
  }, [undo, undoPaused])

  useEffect(() => {
    document.documentElement.dataset.theme = data.theme
    document.documentElement.style.colorScheme = data.theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', data.theme === 'light' ? '#f0f0f0' : '#202020')
  }, [data.theme])

  function navigate(page) {
    setActivePage(page)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  function updateTasks(update) {
    // Read the actual date at the moment of the action, including after sleep.
    const day = localDateKey()
    setData(current => ({ ...current, tasksByDay: { ...current.tasksByDay, [day]: update(current.tasksByDay[day] ?? []) } }))
  }

  function addHabit(name) {
    const habit = { id: crypto.randomUUID(), name, completions: [] }
    setData(current => ({ ...current, habits: [...current.habits, habit] }))
  }

  function toggleHabit(id) {
    const day = localDateKey()
    setData(current => ({ ...current, habits: current.habits.map(habit => habit.id !== id ? habit : {
      ...habit, completions: habit.completions.includes(day) ? habit.completions.filter(date => date !== day) : [...habit.completions, day],
    }) }))
  }

  function deleteHabit(id) {
    const index = data.habits.findIndex(habit => habit.id === id)
    if (index < 0) return
    setUndo({ kind: 'habit', item: data.habits[index], index })
    setData(current => ({ ...current, habits: current.habits.filter(habit => habit.id !== id) }))
  }

  function deleteTask(id) {
    const tasks = data.tasksByDay[today] ?? []
    const index = tasks.findIndex(task => task.id === id)
    if (index < 0) return
    setUndo({ kind: 'task', item: tasks[index], index, day: today })
    setData(current => ({ ...current, tasksByDay: { ...current.tasksByDay, [today]: (current.tasksByDay[today] ?? []).filter(task => task.id !== id) } }))
  }

  function undoDelete() {
    if (!undo) return
    setData(current => undo.kind === 'habit' ? { ...current, habits: restoreItem(current.habits, undo.item, undo.index) }
      : { ...current, tasksByDay: { ...current.tasksByDay, [undo.day]: restoreItem(current.tasksByDay[undo.day] ?? [], undo.item, undo.index) } })
    setUndo(null)
    setUndoPaused(false)
  }

  const timerFinished = clock.remaining === 0
  return (
    <div className="app-shell">
      <header className="desktop-header"><span className="wordmark">Stoic</span><Navigation activePage={activePage} onNavigate={navigate} />        <div className="app-controls" role="group" aria-label="App settings">
          <button className="theme-toggle" aria-label={`Switch to ${data.theme === 'light' ? 'dark' : 'light'} mode`} title={`Switch to ${data.theme === 'light' ? 'dark' : 'light'} mode`} onClick={() => setData(current => ({ ...current, theme: current.theme === 'light' ? 'dark' : 'light' }))}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 3a9 9 0 0 1 0 18Z" fill="currentColor" stroke="none" /></svg>
          </button>
          <AppMenu data={data} onRestore={incoming => { setData(current => mergeBackup(current, incoming)); allowSaving(); setUndo(null) }} install={install} />
        </div></header>
      <main className={`${activePage.toLowerCase()}-main`}>
        {(storageError || clock.error) && <p className="storage-notice" role="status">{storageError || clock.error}</p>}
        <p className={timerFinished ? 'timer-notice' : 'sr-only'} role="status">{timerFinished ? 'Focus session complete.' : ''}</p>
        {activePage === 'Today' && <Today today={today} now={now} tasks={data.tasksByDay[today] ?? []} updateTasks={updateTasks} deleteTask={deleteTask} habits={data.habits} toggleHabit={toggleHabit} onNavigate={navigate} />}
        {activePage === 'Habits' && <Habits habits={data.habits} today={today} onAdd={addHabit} onToggle={toggleHabit} onDelete={deleteHabit} />}
        {activePage === 'Clock' && <Clock clock={clock} now={now} sound={Boolean(data.sound)} onToggleSound={() => { if (!data.sound) void chime.arm(); setData(current => ({ ...current, sound: !current.sound })) }} previewSound={chime.preview} />}
        {activePage === 'Life' && <Life now={now} profile={data.life} onSave={life => setData(current => ({ ...current, life }))} />}

      </main>
      {undo && <div className="undo-toast" onMouseEnter={() => setUndoPaused(true)} onMouseLeave={() => setUndoPaused(false)} onFocus={() => setUndoPaused(true)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setUndoPaused(false) }}>
        <span role="status">{undo.kind === 'task' ? 'Task' : 'Habit'} deleted</span>
        <button onClick={undoDelete}>Undo</button>
        <button className="toast-dismiss" aria-label="Dismiss undo" onClick={() => { setUndo(null); setUndoPaused(false) }}>×</button>
      </div>}
    </div>
  )
}
