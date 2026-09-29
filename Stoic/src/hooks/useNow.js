import { useEffect, useState } from 'react'

export function useNow() {
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    let timeout
    const tick = () => {
      clearTimeout(timeout)
      if (document.hidden) return
      const time = Date.now()
      setNow(time)
      timeout = window.setTimeout(tick, 1000 - time % 1000)
    }
    tick()
    window.addEventListener('focus', tick)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearTimeout(timeout)
      window.removeEventListener('focus', tick)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [])
  return now
}
