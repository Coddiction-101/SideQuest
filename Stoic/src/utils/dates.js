export function localDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseLocalDate(key) {
  if (typeof key !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return null
  const [year, month, day] = key.split('-').map(Number)
  const date = new Date(year, month - 1, day, 12)
  return localDateKey(date) === key ? date : null
}

export function previousDate(key) {
  const date = parseLocalDate(key)
  date.setDate(date.getDate() - 1)
  return localDateKey(date)
}

export function currentStreak(completions, today) {
  const dates = new Set(completions)
  let cursor = dates.has(today) ? today : previousDate(today)
  let streak = 0
  while (dates.has(cursor)) {
    streak += 1
    cursor = previousDate(cursor)
  }
  return streak
}
