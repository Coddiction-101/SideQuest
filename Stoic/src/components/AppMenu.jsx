import { useEffect, useRef, useState } from 'react'
import { downloadBackup, parseBackup } from '../storage/backup.js'

export default function AppMenu({ data, onRestore, install }) {
  const input = useRef(null)
  const menu = useRef(null)
  const [incoming, setIncoming] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState(false)

  useEffect(() => {
    const closeOutside = event => {
      if (menu.current && !menu.current.contains(event.target)) menu.current.open = false
    }
    const closeEscape = event => {
      if (event.key === 'Escape' && menu.current?.open) {
        menu.current.open = false
        menu.current.querySelector('summary').focus()
      }
    }
    document.addEventListener('pointerdown', closeOutside)
    document.addEventListener('keydown', closeEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOutside)
      document.removeEventListener('keydown', closeEscape)
    }
  }, [])

  async function readFile(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setIncoming(null)
    setMessage('')
    try {
      if (file.size > 5 * 1024 * 1024) throw new Error('Choose a backup smaller than 5 MB.')
      setIncoming(parseBackup(await file.text()))
      setError(false)
    } catch (error) { setError(true); setMessage(error.message) }
  }

  return <details className="app-menu" ref={menu}>
    <summary aria-label="App options" title="App options"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /></svg></summary>
    <div className="app-menu-panel">
      <h2>On this device</h2>
      {!install.installed && <button className="menu-action" onClick={install.install}>Install Stoic <span aria-hidden="true">↗</span></button>}
      {install.update && <button className="menu-action" onClick={install.applyUpdate}>Update app</button>}
      <button className="menu-action" onClick={() => { downloadBackup(data); setError(false); setMessage('Backup exported.') }}>Export backup <span aria-hidden="true">↓</span></button>
      <button className="menu-action" onClick={() => input.current.click()}>Restore backup <span aria-hidden="true">↑</span></button>
      <input ref={input} type="file" accept=".json,application/json" aria-label="Choose a Stoic backup" className="sr-only" tabIndex={-1} onChange={readFile} />
      {incoming && <div className="restore-confirmation">
        <p>{Object.values(incoming.tasksByDay).flat().length} tasks · {incoming.habits.length} habits</p>
        <p>Merge this backup with your data? Existing task edits and preferences will be kept.</p>
        <div><button className="soft-button" onClick={() => { onRestore(incoming); setIncoming(null); setError(false); setMessage('Backup restored.') }}>Restore</button><button className="text-button" onClick={() => setIncoming(null)}>Cancel</button></div>
      </div>}
      <p className="menu-note">{install.ready ? 'Ready for offline use.' : 'Data is saved in this browser.'}</p>
      {(message || install.message) && <p className="menu-note" role={error ? 'alert' : 'status'}>{message || install.message}</p>}
    </div>
  </details>
}
