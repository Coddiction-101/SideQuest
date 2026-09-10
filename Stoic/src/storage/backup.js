import { validData } from './data.js'

export function createBackup(data) {
  return JSON.stringify({ app: 'Stoic', version: 1, exportedAt: new Date().toISOString(), data }, null, 2)
}

export function parseBackup(text) {
  if (text.length > 5 * 1024 * 1024) throw new Error('Choose a backup smaller than 5 MB.')
  let backup
  try { backup = JSON.parse(text) } catch { throw new Error('This file is not a valid JSON backup.') }
  if (backup?.app !== 'Stoic' || backup.version !== 1 || !validData(backup.data)) throw new Error('This is not a supported Stoic backup.')
  return backup.data
}

export function mergeBackup(current, imported) {
  // Existing task edits win; missing items and completion dates are recovered.
  const tasksByDay = { ...current.tasksByDay }
  for (const [day, tasks] of Object.entries(imported.tasksByDay)) {
    const existing = tasksByDay[day] ?? []
    const ids = new Set(existing.map(task => task.id))
    tasksByDay[day] = [...existing, ...tasks.filter(task => !ids.has(task.id))]
  }
  const habits = current.habits.map(habit => {
    const incoming = imported.habits.find(item => item.id === habit.id)
    return incoming ? { ...habit, completions: [...new Set([...habit.completions, ...incoming.completions])].sort() } : habit
  })
  const ids = new Set(habits.map(habit => habit.id))
  habits.push(...imported.habits.filter(habit => !ids.has(habit.id)))
  return { ...current, tasksByDay, habits, life: current.life ?? imported.life }
}

export function downloadBackup(data) {
  const blob = new Blob([createBackup(data)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `stoic-backup-${new Date().toISOString().slice(0, 10)}.json`
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
