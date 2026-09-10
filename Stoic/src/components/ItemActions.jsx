import { useEffect, useRef } from 'react'

export default function ItemActions({ name, children }) {
  const ref = useRef(null)
  useEffect(() => {
    const closeOutside = event => {
      if (ref.current && !ref.current.contains(event.target)) ref.current.open = false
    }
    const closeEscape = event => {
      if (event.key === 'Escape' && ref.current?.open) {
        ref.current.open = false
        ref.current.querySelector('summary').focus()
      }
    }
    document.addEventListener('pointerdown', closeOutside)
    document.addEventListener('keydown', closeEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOutside)
      document.removeEventListener('keydown', closeEscape)
    }
  }, [])
  return (
    <details className="task-menu" ref={ref}>
      <summary aria-label={`Actions for ${name}`}><span aria-hidden="true">···</span></summary>
      <div className="task-actions" onClick={event => {
        if (event.target.closest('button')) {
          ref.current.open = false
          ref.current.querySelector('summary').focus()
        }
      }}>{children}</div>
    </details>
  )
}
