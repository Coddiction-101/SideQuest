import { useEffect, useState } from 'react'

export function useStoredState(key, initialValue, validate) {
  const [loaded] = useState(() => {
    try {
      const raw = localStorage.getItem(key)
      if (raw === null) return { value: initialValue, error: '' }
      const value = JSON.parse(raw)
      if (!validate(value)) throw new Error('Invalid saved data')
      return { value, error: '' }
    } catch {
      return { value: initialValue, error: 'Saved data could not be read. Changes will stay in this tab for now.' }
    }
  })
  const [value, setValue] = useState(loaded.value)
  const [error, setError] = useState(loaded.error)
  const [blocked, setBlocked] = useState(Boolean(loaded.error))

  useEffect(() => {
    // Preserve unreadable data rather than overwriting it with an empty state.
    if (blocked) return
    try {
      localStorage.setItem(key, JSON.stringify(value))
      setError('')
    } catch {
      setError('Changes could not be saved on this device. Keep this tab open to retain them.')
    }
  }, [key, value, blocked])

  return [value, setValue, error, () => setBlocked(false)]
}
