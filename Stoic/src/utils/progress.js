import { parseLocalDate } from './dates.js'

const clamp = value => Math.max(0, Math.min(100, value))
const percent = (now, start, end) => clamp((now - start) / (end - start) * 100)

export function timeProgress(now) {
  const date = new Date(now)
  const year = date.getFullYear()
  const month = date.getMonth()
  const dayStart = new Date(year, month, date.getDate())
  const dayEnd = new Date(year, month, date.getDate() + 1)
  const monthStart = new Date(year, month, 1)
  const monthEnd = new Date(year, month + 1, 1)
  const yearStart = new Date(year, 0, 1)
  const yearEnd = new Date(year + 1, 0, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInYear = (Date.UTC(year + 1, 0, 1) - Date.UTC(year, 0, 1)) / 86400000
  const elapsedDays = (Date.UTC(year, month, date.getDate()) - Date.UTC(year, 0, 1)) / 86400000
  const elapsedMinutes = Math.floor((now - dayStart) / 60000)
  return [
    { label: 'Today', percent: percent(now, dayStart, dayEnd), detail: `${Math.floor(elapsedMinutes / 60)}h ${elapsedMinutes % 60}m of ${(dayEnd - dayStart) / 3600000}h` },
    { label: 'Month', percent: percent(now, monthStart, monthEnd), detail: `${date.getDate() - 1} of ${daysInMonth} days elapsed` },
    { label: 'Year', percent: percent(now, yearStart, yearEnd), detail: `${elapsedDays} of ${daysInYear} days elapsed` },
  ]
}

export function lifeProgress(birthDate, lifespan, now) {
  const birth = parseLocalDate(birthDate)
  birth.setHours(0, 0, 0, 0)
  const endYear = birth.getFullYear() + lifespan
  const endDay = Math.min(birth.getDate(), new Date(endYear, birth.getMonth() + 1, 0).getDate())
  const end = new Date(endYear, birth.getMonth(), endDay)
  const current = new Date(now)
  let age = current.getFullYear() - birth.getFullYear()
  const birthdayDay = Math.min(birth.getDate(), new Date(current.getFullYear(), birth.getMonth() + 1, 0).getDate())
  if (current < new Date(current.getFullYear(), birth.getMonth(), birthdayDay)) age -= 1
  return { age: Math.max(0, age), percent: percent(now, birth, end) }
}
