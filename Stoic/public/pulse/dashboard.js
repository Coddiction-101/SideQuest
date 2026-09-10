(() => {
  const api = window.WatcherAPI;
  const number = value => typeof value === 'number' && Number.isFinite(value) && value >= 0;
  const display = value => number(value) ? Math.round(value) : '—';
  const average = (rows, key) => {
    const values = rows.map(row => row[key]).filter(number);
    return values.length ? `${Math.round(values.reduce((a, b) => a + b, 0) / values.length)} ms` : '—';
  };
  function render() {
    const rows = api.getMetrics();
    document.getElementById('status').textContent = api.getError() || 'Local only · updates automatically · up to 1,000 samples';
    document.getElementById('empty').hidden = rows.length > 0;
    document.getElementById('total-samples').textContent = rows.length;
    for (const [id, key] of [['avg-load', 'pageLoadTime'], ['avg-fcp', 'fcp'], ['avg-lcp', 'lcp']]) document.getElementById(id).textContent = average(rows, key);
    const body = document.querySelector('tbody');
    body.replaceChildren();
    for (const row of rows.slice(-50).reverse()) {
      const tr = document.createElement('tr');
      const values = [new Date(row.timestamp).toLocaleString(), row.url, display(row.pageLoadTime), display(row.fcp), display(row.lcp), number(row.cls) ? row.cls.toFixed(3) : '—', row.viewport];
      for (const value of values) { const td = document.createElement('td'); td.textContent = value ?? '—'; tr.append(td); }
      body.append(tr);
    }
    const canvas = document.getElementById('load-chart'), ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const values = rows.slice(-30).map(row => row.pageLoadTime).filter(number);
    if (!values.length) return;
    const max = Math.max(...values, 1), width = canvas.width, height = canvas.height, p = 28;
    ctx.strokeStyle = '#626262'; ctx.lineWidth = 2; ctx.beginPath();
    values.forEach((value, i) => {
      const x = p + i / Math.max(values.length - 1, 1) * (width - 2 * p), y = height - p - value / max * (height - 2 * p);
      if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    });
    ctx.stroke(); ctx.fillStyle = '#202020';
    values.forEach((value, i) => { ctx.beginPath(); ctx.arc(p + i / Math.max(values.length - 1, 1) * (width - 2 * p), height - p - value / max * (height - 2 * p), 4, 0, Math.PI * 2); ctx.fill(); });
  }
  document.getElementById('export-json').onclick = () => api.exportJSON();
  document.getElementById('export-csv').onclick = () => api.exportCSV();
  document.getElementById('clear').onclick = () => { if (confirm('Clear Pulse samples from this browser? Your app data will stay intact.')) { api.clearMetrics(); render(); } };
  window.addEventListener('storage', render);
  window.addEventListener('pulse-update', render);
  window.addEventListener('focus', render);
  render();
})();
