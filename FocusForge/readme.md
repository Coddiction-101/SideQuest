 # FocusForge — Deep Work Command Centre

> [Live Preview](https://coddiction-101.github.io/VibeHai/FocusForge/)

A structured productivity dashboard built to help you focus deeply, manage task priorities, and track your deep work sessions — without the noise.

---

## Overview

FocusForge is not a typical to-do app. It is designed around the idea that clarity creates focus. Instead of overwhelming you with features, it gives you clear priorities, a controlled workload view, and intentional focus sessions backed by a Pomodoro-style timer.

---

## Features

### Priority-Based Task System

Tasks are organised into three priority levels:

- **Critical** — Must be done. Blocks progress.
- **Important** — High value. Should be done today.
- **Optional** — Nice to have. Do it when capacity allows.

Each task is visually distinguished by a colored left border for fast scanning. Tasks persist across sessions via `localStorage`.

### Mental Load Meter

A dynamic cognitive load indicator based on the number and priority weight of your active tasks. It warns you before you over-plan, helping prevent burnout.

| Priority | Weight |
|----------|--------|
| Critical | 3 |
| Important | 2 |
| Optional | 1 |

### Deep Work Timer

A Pomodoro-style circular timer with four configurable phases:

| Phase | Duration |
|-------|----------|
| Focus Session | 25 min |
| Deep Focus | 50 min |
| Short Break | 5 min |
| Long Break | 15 min |

Completed sessions are logged with a timestamp and goal label.

### Ambient Theme Modes

Switch the interface accent colour to match your current work mode:

| Theme | Accent Color | Mood |
|-------|-------------|------|
| Orbit | Blue `#3B6EFF` | Default, clean |
| Matrix | Green `#5DB832` | Focused, sharp |
| Mars | Red `#D93636` | Intense, urgent |

Theme preference is saved to `localStorage`.

### Focus Stats

Tracks completed sessions, total focus time, tasks created, and task completion rate across your entire usage history.

---

## Tech Stack

- HTML5
- CSS3 (Vanilla — no frameworks)
- JavaScript (Vanilla — no libraries)

No build tools, no dependencies, no installation required.

---

## Project Structure

```txt
FocusForge/
├── index.html      # App structure and markup
├── style.css       # Design system, themes, layout, components
├── script.js       # App logic — timer, tasks, stats, persistence
└── README.md
