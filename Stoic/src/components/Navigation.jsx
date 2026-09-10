const icons = {
  Today: <><path d="m3 10 9-7 9 7" /><path d="M5 9v12h5v-7h4v7h5V9" /></>,
  Habits: <><path d="M20 4C8 2 2 9 7 16c7 5 14-1 13-12Z" /><path d="M4 21 16 9" /></>,
  Clock: <><circle cx="12" cy="14" r="8" /><path d="M12 10v4l2 2M9 2h6M12 2v4m6 1 2-2" /></>,
  Life: <path d="M4 20v-6h3v6Zm6 0V9h3v11Zm6 0V4h3v16Z" />,
}

export default function Navigation({ activePage, onNavigate }) {
  return (
    <nav className="navigation" aria-label="Main navigation">
      {Object.entries(icons).map(([page, icon]) => (
        <button key={page} type="button" aria-current={activePage === page ? 'page' : undefined} onClick={() => onNavigate(page)}>
          <span className="nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{icon}</svg>
          </span>
          <span>{page}</span>
        </button>
      ))}
    </nav>
  )
}
