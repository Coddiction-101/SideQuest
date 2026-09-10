# Stoic

A small habit and daily-focus app. React, Vite, JavaScript, and plain CSS.

## Run it

```sh
npm install
npm run dev
```

Use the local address printed in the terminal. Requires Node.js 24 for the included test command.

```sh
npm test
npm run build
npm run preview
```

## What is complete

- Today: add, complete, undo, delete, reorder; daily counts and a fresh list at local midnight.
- Habits: add, complete, undo, delete, current streaks, and a shared preview on Today.
- Clock: adjustable timer, date/time countdown, stopwatch.
- Life: day, month, year, and personal estimated-lifespan progress; birth date and lifespan remain editable.
- Local saving, light/dark mode, keyboard controls, reduced-motion support, desktop navigation, and mobile bottom navigation.
- Deletion undo, desktop drag reordering, optional completion chime, backup export/restore, and an installable offline app.

Data stays in this browser, under `stoic.data.v1` and `stoic.clock.v1`. Previous task days and habit completion dates are retained. No account or server is required. Clearing browser storage removes that browser's data. Different browsers or site addresses have separate storage.

## Learn the code in this order

1. `src/App.jsx` owns shared data. Today and Habits receive the same habits; Today and Clock receive the same timer.
2. `src/pages/Today.jsx` turns a task array into rows. Event handlers create a new array, then React updates the display.
3. `src/pages/Habits.jsx` and `src/components/HabitItem.jsx` reuse that pattern. `src/utils/dates.js` computes streaks from actual completion dates, so undo and missed days stay consistent.
4. `src/hooks/useClock.js` stores timer deadlines and stopwatch start times. `src/hooks/useNow.js` updates the display; it never subtracts a fixed amount per interval, so throttled tabs still show the right time.
5. `src/utils/progress.js` calculates local calendar boundaries, leap-year totals, and estimated life progress.
6. `src/hooks/useStoredState.js` loads validated data and saves changes. An unreadable saved value is preserved rather than silently overwritten.
7. `src/style.css` contains the shared visual variables, four screen styles, mobile navigation, and dark theme.

Small learning exercise: change the default timer duration in `useClock.js`, then trace how the timer value reaches the Clock screen. An existing saved duration takes precedence over that default.

## Validation

`npm test` runs deterministic date, streak, reorder, clock, progress, and data-validation tests.

`node scripts/verify-browser.mjs` runs browser checks and writes screenshots to `artifacts/`. It uses a separate temporary Chrome profile and never touches your normal browser data. On Windows it defaults to the standard Chrome executable; set `CHROME_PATH` for a different executable and `STOIC_URL` for a different local address. Start the development server first.

The browser checks cover all four pages and every clock mode at nine viewport sizes, from 320×568 to 1440×900, including a 768×520 installed-app window and 844×390 landscape layout. They verify horizontal and vertical fit with a standard content fixture, task and habit interactions, clock controls, refreshing a running timer, Life setup, themes, local saving, midnight rollover, and unreadable storage. Today keeps tasks and habits in one column at every width. Short landscape windows, long lists, and expanded forms scroll naturally; content is never clipped to force it to fit.

## Install and use it

Build first, then serve the production app. Stop the development server before using the same port:

```sh
npm run build
npm run preview -- --host 127.0.0.1 --port 5173 --strictPort
```

Open **http://localhost:5173/** in Chrome or Edge. Use the small **App options** menu in the top-right header, choose **Install Stoic**, and confirm the browser's install dialog. The installed app opens in its own window. Keep the exact same address and browser profile to retain your existing data.

The options menu says **Ready for offline use** after the app has cached its files. Once ready, the installed app can reopen and save changes even with the local server stopped. Restart the server when you want to receive a new build; an **Update app** action appears in the options menu when an update is waiting.

Installation on another device requires serving the app over HTTPS on a host that device can reach. A computer's localhost address only refers to that computer. See [MDN's installation guide](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable).

## Everyday details

- **Undo:** after deleting a task or habit, use the toast's Undo action within 15 seconds. Hovering or keyboard-focusing it pauses dismissal. The last deletion is restored to its original place, including the original day and habit history.
- **Reorder:** on desktop, hover a task to reveal its drag handle. The handle also accepts Up/Down arrow keys. The existing Move up/down menu works on touch screens.
- **Sound:** enable Completion sound in Timer mode, then use Preview to hear the soft chime. It plays while Stoic is open; a closed or suspended app cannot guarantee an alarm.
- **Backup:** App options → Export backup downloads tasks, history, habits, Life details, and preferences as JSON. Restore validates and previews a backup before merging it. Existing task edits and preferences take precedence; missing items and habit completion dates are recovered. Active clock sessions are not part of the backup.

`node scripts/verify-install.mjs` builds no files; run `npm run build` first. It serves `dist` on a private temporary local port, installs Stoic into an isolated Chrome profile, launches it in standalone mode, tests backup/restore, stops the origin server, and checks that offline reloads and saves still work. It removes its test installation afterward. Your normal browser profile is not changed.
