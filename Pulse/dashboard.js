
const renderDashboard = () => {
    const metrics = window.WatcherAPI.getMetrics();

    if (metrics.length === 0) {
        document.body.innerHTML = '<div style="padding: 40px; text-align: center;"><h2>No data yet</h2><p>Add watcher.js to your website to start tracking performance.</p></div>';
        return;
    }

    // Stats
    const loads = metrics.map(m => m.pageLoadTime);
    const lcps = metrics.map(m => m.lcp).filter(x => x > 0);

    document.getElementById('total-samples').textContent = metrics.length;
    document.getElementById('avg-load').textContent = Math.round(loads.reduce((a, b) => a + b) / loads.length) + 'ms';
    document.getElementById('avg-lcp').textContent = lcps.length ? Math.round(lcps.reduce((a, b) => a + b) / lcps.length) + 'ms' : '—';
    document.getElementById('mobile-pct').textContent = Math.round((metrics.filter(m => m.device === 'mobile').length / metrics.length) * 100) + '%';

    // Table
    const tbody = document.querySelector('table tbody');
    tbody.innerHTML = metrics.slice().reverse().slice(0, 50).map(m => `
    <tr>
      <td>${new Date(m.timestamp).toLocaleString()}</td>
      <td>${m.pageLoadTime}</td>
      <td>${m.lcp}</td>
      <td>${m.cls}</td>
      <td>${m.device}</td>
      <td>${m.referrer.split('/')[2] || m.referrer}</td>
    </tr>
  `).join('');

    // Chart
    drawChart(loads.slice(-30));
};

const drawChart = (data) => {
    const canvas = document.getElementById('load-chart');
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height, p = 40;

    ctx.fillStyle = '#f5f5f1';
    ctx.fillRect(0, 0, w, h);

    if (data.length < 2) return;

    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    // Line
    ctx.strokeStyle = '#111214';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    data.forEach((d, i) => {
        const x = p + (i / (data.length - 1)) * (w - p * 2);
        const y = h - p - ((d - min) / range) * (h - p * 2);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Dots
    ctx.fillStyle = '#111214';
    data.forEach((d, i) => {
        const x = p + (i / (data.length - 1)) * (w - p * 2);
        const y = h - p - ((d - min) / range) * (h - p * 2);
        ctx.fillRect(x - 3, y - 3, 6, 6);
    });

    // Axes
    ctx.strokeStyle = '#e2e1da';
    ctx.beginPath();
    ctx.moveTo(p, p);
    ctx.lineTo(p, h - p);
    ctx.lineTo(w - p, h - p);
    ctx.stroke();
};

renderDashboard();
