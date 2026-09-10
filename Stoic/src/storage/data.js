import { parseLocalDate } from '../utils/dates.js'

export const initialData = { tasksByDay: {}, habits: [], life: null, theme: 'light', sound: false }

export function validLife(value) {
  return value && parseLocalDate(value.birthDate) &&
    Number.isInteger(value.lifespan) && value.lifespan >= 1 && value.lifespan <= 150
}

export function validData(data) {
  const unique = items => new Set(items.map(item => item?.id)).size === items.length
  const taskValid = task => task && typeof task.id === 'string' && task.id.length > 0 && typeof task.text === 'string' && typeof task.completed === 'boolean'
  return data && typeof data === 'object' && data.tasksByDay && typeof data.tasksByDay === 'object' && !Array.isArray(data.tasksByDay) &&
    Object.entries(data.tasksByDay).every(([key, tasks]) => parseLocalDate(key) && Array.isArray(tasks) && unique(tasks) && tasks.every(taskValid)) &&
    Array.isArray(data.habits) && data.habits.every(habit => habit && typeof habit.id === 'string' &&
      typeof habit.name === 'string' && Array.isArray(habit.completions) && habit.completions.every(key => parseLocalDate(key))) &&
    unique(data.habits) && (data.sound === undefined || typeof data.sound === 'boolean') &&
    (data.life === null || validLife(data.life)) && ['light', 'dark'].includes(data.theme)
}
