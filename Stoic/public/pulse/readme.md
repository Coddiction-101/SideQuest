# Pulse

Local browser performance diagnostics. No account, backend, or external analytics service.

## Test Stoic now

Stoic includes Pulse at /pulse/index.html. Open Stoic, load it once, then use App options > Pulse performance. Keep the dashboard open in another tab on the same browser and exact domain to see updates as you reload the app.

The dashboard measures page loads, first contentful paint (FCP), largest contentful paint (LCP), layout shifts (CLS), and viewport size. Unsupported metrics appear as a dash. CLS uses session windows and is a score, not a percentage. These are local diagnostics, not a complete Core Web Vitals implementation: BFCache restores and background/prerender lifecycle handling are not normalized. SPA section changes do not count as new page loads.

## Use with another website

Serve these four files under /pulse/ on that website. Add this to the app HTML:

```html
<script defer src="/pulse/watcher.js"></script>
```

Then open /pulse/index.html. The dashboard must share the app's origin; a separate Pulse domain cannot read another site's browser storage. Hosting the dashboard alone does not collect traffic.

## Data and limits

Samples stay in localStorage under pulse.metrics.v2, capped at 1,000 per browser and origin. No network requests, visitor identifiers, user agent strings, query parameters, task text, habit names, or birthdays are collected. The URL pathname is recorded; avoid placing sensitive content in paths. Previous watcher_metrics records are left untouched because their metric definitions were incorrect.

JSON/CSV exports allow manual sharing of test results. Clear samples only clears Pulse data. An empty dashboard stays usable and updates when another tab saves a sample. Concurrent writes from multiple app tabs are best effort; this is not a durable traffic ledger.

To aggregate users or devices live, Pulse still needs a collection endpoint, database, and protected admin dashboard. This release does not provide global traffic analytics.

## Verification

From Stoic, run npm run build and start npm run preview on port 5173, then node scripts/verify-pulse.mjs. The script uses an isolated Chrome profile to check collection, dashboard isolation, safe rendering, storage recovery, responsive widths, and offline access.
