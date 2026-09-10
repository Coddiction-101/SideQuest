import { useEffect, useState } from 'react'
import { localDateKey } from '../utils/dates.js'

export function useTodayDate() {
  const [today, setToday] = useState(() => localDateKey())

  useEffect(() => {
    const updateDate = () => setToday(localDateKey())
    const interval = window.setInterval(updateDate, 1000)
    window.addEventListener('focus', updateDate)
    document.addEventListener('visibilitychange', updateDate)

    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', updateDate)
      document.removeEventListener('visibilitychange', updateDate)
    }
  }, [])

  return today
}
