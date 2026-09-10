// Pulse: local browser diagnostics. No network requests or app content collection.
(() => {
  if (window.WatcherAPI) return;
  const key = 'pulse.metrics.v2';
  let error = '';
  function getMetrics() {
    try {
      const rows = JSON.parse(localStorage.getItem(key) || '[]');
      if (!Array.isArray(rows)) throw new Error();
      error = '';
      return rows.filter(row => row && typeof row.id === 'string').slice(-1000);
    } catch { error = 'Pulse storage is unavailable or unreadable. Existing data was not overwritten.'; return []; }
  }
  function download(content, type, extension) {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `pulse-${new Date().toISOString().slice(0, 10)}.${extension}`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  window.WatcherAPI = {
    getMetrics,
    getError: () => error,
    clearMetrics() {
      try { localStorage.removeItem(key); error = ''; window.dispatchEvent(new Event('pulse-update')); }
      catch { error = 'Cannot clear Pulse storage in this browser.'; }
    },
    exportJSON: () => download(JSON.stringify(getMetrics(), null, 2), 'application/json', 'json'),
    exportCSV() {
      const headers = ['timestamp', 'url', 'pageLoadTime', 'fcp', 'lcp', 'cls', 'viewport'];
      const cell = value => '"' + String(value ?? '').replace(/^[=+@-]/, "'$&").replaceAll('"', '""') + '"';
      download([headers.join(','), ...getMetrics().map(row => headers.map(h => cell(row[h])).join(','))].join('\r\n'), 'text/csv', 'csv');
    }
  };
  // Loading the dashboard must not count as an app visit.
  if (document.currentScript?.hasAttribute('data-dashboard')) return;
  const supported = window.PerformanceObserver?.supportedEntryTypes || [];
  const metric = {
    id: crypto.randomUUID(), timestamp: new Date().toISOString(), url: location.pathname,
    pageLoadTime: null, fcp: null, lcp: null,
    cls: supported.includes('layout-shift') ? 0 : null,
    viewport: `${innerWidth} × ${innerHeight}`
  };
  let loaded = false, saveTimer, sessionStart = 0, previousShift = 0, sessionScore = 0;
  function save() {
    if (!loaded) return;
    const records = getMetrics();
    if (error) return;
    const index = records.findIndex(row => row.id === metric.id);
    if (index < 0) records.push(metric); else records[index] = metric;
    try {
      localStorage.setItem(key, JSON.stringify(records.slice(-1000)));
      window.dispatchEvent(new Event('pulse-update'));
    } catch { error = 'Pulse could not save this sample. Browser storage may be full.'; }
  }
  function scheduleSave() { clearTimeout(saveTimer); saveTimer = setTimeout(save, 250); }
  function observe(type, onEntry) {
    if (!supported.includes(type)) return;
    try {
      new PerformanceObserver(list => {
        list.getEntries().forEach(onEntry);
        scheduleSave();
      }).observe({ type, buffered: true });
    } catch { /* Unsupported metrics remain unavailable instead of reporting a false zero. */ }
  }
  observe('paint', entry => {
    if (entry.name === 'first-contentful-paint') metric.fcp = Math.round(entry.startTime);
  });
  observe('largest-contentful-paint', entry => { metric.lcp = Math.round(entry.startTime); });
  observe('layout-shift', entry => {
    if (entry.hadRecentInput) return;
    if (sessionScore && entry.startTime - previousShift < 1000 && entry.startTime - sessionStart < 5000) sessionScore += entry.value;
    else { sessionStart = entry.startTime; sessionScore = entry.value; }
    previousShift = entry.startTime;
    metric.cls = Math.max(metric.cls || 0, sessionScore);
  });
  function afterLoad() {
    // Read loadEventEnd only after the load event has finished dispatching.
    setTimeout(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      metric.pageLoadTime = navigation?.loadEventEnd > 0 ? Math.round(navigation.loadEventEnd) : null;
      loaded = true;
      save();
    }, 0);
  }
  if (document.readyState === 'complete') afterLoad();
  else window.addEventListener('load', afterLoad, { once: true });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') save(); });
})();
