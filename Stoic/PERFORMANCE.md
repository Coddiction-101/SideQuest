# Typography and performance update ? 2026-09-29

- UI: Satoshi, 400/500/700, from Fontshare (https://www.fontshare.com/fonts/satoshi). License: ITF Free Font License, https://www.fontshare.com/licenses/itf-ffl. The build downloads the official WOFF2 assets; raw font files are not committed. Browser requests are same-origin and fonts are included in the offline cache.
- Display: locally installed Baskerville, regular weight; Libre Baskerville Regular is the packaged fallback. Libre Baskerville is supplied by @fontsource/libre-baskerville under its included OFL license. The project does not redistribute the system Baskerville font.
- Replaced the lifetime estimate with a Time view containing Today, Month and Year. Existing saved profiles/backups are still readable; stored data is not deleted.
- Replaced whole-app 200 ms polling with second-aligned updates that stop while the document is hidden and refresh on return.
- Memoized dot grids and replaced per-dot JavaScript animation with one reduced-motion-aware CSS transition. Removed animejs and duplicate time-view layout rules.
- Fixed time-tab keyboard navigation and prevented vertical/diagonal scrolling from accidentally changing time scale.
- Scoped npm test to tests/*.test.js so release-directory copies do not run repeatedly.

## Verification

Production build and 10 core tests passed. Browser checks passed at nine viewports from 320x568 to 1920x1080, including all clock modes and all three time scales. Actual isolated Chrome PWA install, offline reload, task saving, backup export/restore, drag reorder, and timer audio passed. Short landscape Today pages and long lists can scroll naturally.

Local build JS/CSS/font assets: 1,385,592 bytes before, 390,940 after (~72% reduction). Offline precache entries: 72 -> 19. One 3-second idle Time-view sample measured script work at 20 ms before and 12 ms after; this is a local diagnostic, not a field-performance guarantee.

Run npm run build, npm run preview -- --port 5174, and set STOIC_URL=http://localhost:5174/ before running scripts/verify-browser.mjs or scripts/audit-performance.mjs. scripts/verify-install.mjs hosts its own test server. Browser scripts use an isolated Chrome profile.
