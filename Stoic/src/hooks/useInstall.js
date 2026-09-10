import { useEffect, useState } from 'react'

export function useInstall() {
  const [prompt, setPrompt] = useState(null)
  const [installed, setInstalled] = useState(() => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true)
  const [ready, setReady] = useState(false)
  const [update, setUpdate] = useState(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const beforeInstall = event => { event.preventDefault(); setPrompt(event) }
    const onInstalled = () => { setInstalled(true); setPrompt(null); setMessage('Installed. Open Stoic from your apps.') }
    window.addEventListener('beforeinstallprompt', beforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    if (import.meta.env.PROD && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(registration => {
        if (registration.waiting) setUpdate(registration.waiting)
        registration.addEventListener('updatefound', () => {
          const worker = registration.installing
          worker?.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) setUpdate(worker)
          })
        })
        return navigator.serviceWorker.ready
      }).then(() => setReady(true)).catch(() => setMessage('Offline setup could not finish. Reopen Stoic when you are connected.'))
    }
    return () => { window.removeEventListener('beforeinstallprompt', beforeInstall); window.removeEventListener('appinstalled', onInstalled) }
  }, [])

  async function install() {
    if (prompt) {
      await prompt.prompt()
      const result = await prompt.userChoice
      setPrompt(null)
      setMessage(result.outcome === 'accepted' ? 'Installed. Open Stoic from your apps.' : 'You can install later from this menu.')
    } else {
      setMessage(import.meta.env.DEV ? 'Installation is available in the built app.' : 'Use your browser’s Install app option. On iPhone, use Share → Add to Home Screen.')
    }
  }

  function applyUpdate() {
    if (!update) return
    navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload(), { once: true })
    update.postMessage({ type: 'ACTIVATE_UPDATE' })
  }
  return { installed, ready, message, install, update, applyUpdate }
}
