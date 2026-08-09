// Watcher Performance Monitor v1.0
(function () {
    const WATCHER_STORAGE_KEY = 'watcher_metrics';
    const MAX_RECORDS = 1000;

    const captureMetrics = () => {
        try {
            const perfData = window.performance.getEntriesByType('navigation')[0];
            if (!perfData) return;

            // Web Vitals
            const getCLS = () => {
                return new Promise(resolve => {
                    new PerformanceObserver((list) => {
                        for (const entry of list.getEntries()) {
                            if (!entry.hadRecentInput) {
                                resolve(entry.value);
                            }
                        }
                    }).observe({ entryTypes: ['layout-shift'] });
                    setTimeout(() => resolve(0), 5000);
                });
            };

            const getLCP = () => {
                return new Promise(resolve => {
                    new PerformanceObserver((list) => {
                        const entries = list.getEntries();
                        const lastEntry = entries[entries.length - 1];
                        resolve(lastEntry ? lastEntry.renderTime || lastEntry.loadTime : 0);
                    }).observe({ entryTypes: ['largest-contentful-paint'] });
                    setTimeout(() => resolve(0), 5000);
                });
            };

            Promise.all([getCLS(), getLCP()]).then(([cls, lcp]) => {
                const metric = {
                    timestamp: new Date().toISOString(),
                    url: window.location.pathname,
                    pageLoadTime: Math.round(perfData.loadEventEnd - perfData.fetchStart),
                    domInteractive: Math.round(perfData.domInteractive - perfData.fetchStart),
                    domContentLoaded: Math.round(perfData.domContentLoadedEventEnd - perfData.fetchStart),
                    firstPaint: perfData.responseEnd ? Math.round(perfData.responseEnd - perfData.fetchStart) : 0,
                    fcp: Math.round(perfData.responseEnd - perfData.fetchStart),
                    lcp: Math.round(lcp),
                    cls: Math.round(cls * 100),
                    device: navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop',
                    referrer: document.referrer || 'direct',
                    userAgent: navigator.userAgent
                };

                const records = JSON.parse(localStorage.getItem(WATCHER_STORAGE_KEY) || '[]');
                records.push(metric);
                localStorage.setItem(WATCHER_STORAGE_KEY, JSON.stringify(records.slice(-MAX_RECORDS)));
            });
        } catch (e) {
            console.error('Watcher error:', e);
        }
    };

    // Capture on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.addEventListener('load', captureMetrics);
        });
    } else {
        window.addEventListener('load', captureMetrics);
    }

    // Expose API for dashboard
    window.WatcherAPI = {
        getMetrics: () => JSON.parse(localStorage.getItem(WATCHER_STORAGE_KEY) || '[]'),
        clearMetrics: () => localStorage.removeItem(WATCHER_STORAGE_KEY),
        exportJSON: () => {
            const data = JSON.stringify(window.WatcherAPI.getMetrics(), null, 2);
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `watcher-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
        },
        exportCSV: () => {
            const metrics = window.WatcherAPI.getMetrics();
            const headers = Object.keys(metrics[0] || {});
            const csv = [headers.join(','), ...metrics.map(m => headers.map(h => m[h]).join(','))].join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `watcher-${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
        }
    };
})();
