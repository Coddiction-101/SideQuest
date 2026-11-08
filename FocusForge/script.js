/* ═══════════════════════════════
   FOCUSFORGE — script.js
   ═══════════════════════════════ */

// ── State ──
const state = {
  tasks: [],
  sessions: 0,
  totalFocusMinutes: 0,
  sessionHistory: [],
  currentFilter: 'all',
  timerRunning: false,
  timerSeconds: 25 * 60,
  timerTotal: 25 * 60,
  timerInterval: null,
  currentPhaseLabel: 'Focus Session',
  fullFocus: false,
};

// ── Init ──
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  updateClock();
  setInterval(updateClock, 1000);
  renderTasks();
  renderStats();
  updateMentalLoad();
  updateThemeButtons();
  initTimerRing();
});

// ── Persist ──
function saveState() {
  localStorage.setItem('ff_tasks', JSON.stringify(state.tasks));
  localStorage.setItem('ff_sessions', state.sessions);
  localStorage.setItem('ff_minutes', state.totalFocusMinutes);
  localStorage.setItem('ff_history', JSON.stringify(state.sessionHistory));
}

function loadState() {
  state.tasks = JSON.parse(localStorage.getItem('ff_tasks') || '[]');
  state.sessions = parseInt(localStorage.getItem('ff_sessions') || '0');
  state.totalFocusMinutes = parseInt(localStorage.getItem('ff_minutes') || '0');
  state.sessionHistory = JSON.parse(localStorage.getItem('ff_history') || '[]');
  const theme = localStorage.getItem('ff_theme') || 'orbit';
  applyTheme(theme);
}

// ── Clock ──
function updateClock() {
  const now = new Date();
  const timeEl = document.getElementById('time-display');
  const dateEl = document.getElementById('date-display');
  if (timeEl) timeEl.textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  if (dateEl) dateEl.textContent = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

// ── Navigation ──
function showSection(name, btn) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.getElementById('section-' + name).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  const titles = { dashboard: 'Dashboard', tasks: 'Tasks', focus: 'Deep Work', stats: 'Focus Stats' };
  document.getElementById('page-title').textContent = titles[name] || name;
  if (name === 'stats') renderStats();
  if (name === 'dashboard') {
    renderStats();
    renderDashboardPreview();
  }
}

// ── Sidebar Toggle ──
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const main = document.getElementById('main-content');
  const isMobile = window.innerWidth <= 680;
  if (isMobile) {
    sidebar.classList.toggle('open');
  } else {
    sidebar.classList.toggle('collapsed');
    main.classList.toggle('full');
  }
}

// ── Theme ──
function setTheme(theme) {
  applyTheme(theme);
  localStorage.setItem('ff_theme', theme);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  updateThemeButtons(theme);
  // Update ring stroke color
  const ring = document.getElementById('ring-fill');
  if (ring) {
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
    ring.style.stroke = accent;
  }
}

function updateThemeButtons(theme) {
  theme = theme || localStorage.getItem('ff_theme') || 'orbit';
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.id === 'theme-' + theme);
  });
}

// ══════════════════════════
// TASKS
// ══════════════════════════
function addTask() {
  const input = document.getElementById('task-input');
  const priority = document.getElementById('task-priority');
  const text = input.value.trim();
  if (!text) { input.focus(); return; }

  state.tasks.unshift({ id: Date.now(), text, priority: priority.value, done: false });
  input.value = '';
  saveState();
  renderTasks();
  updateMentalLoad();
  renderDashboardPreview();
}

// Enter key in task input
document.addEventListener('DOMContentLoaded', () => {
  const ti = document.getElementById('task-input');
  if (ti) ti.addEventListener('keydown', e => { if (e.key === 'Enter') addTask(); });
});

function toggleTask(id) {
  const task = state.tasks.find(t => t.id === id);
  if (!task) return;
  task.done = !task.done;
  if (task.done) {
    const doneEl = document.getElementById('dash-tasks');
    if (doneEl) doneEl.textContent = state.tasks.filter(t => t.done).length;
  }
  saveState();
  renderTasks();
  updateMentalLoad();
  renderStats();
  renderDashboardPreview();
}

function deleteTask(id) {
  state.tasks = state.tasks.filter(t => t.id !== id);
  saveState();
  renderTasks();
  updateMentalLoad();
  renderStats();
  renderDashboardPreview();
}

function filterTasks(filter, btn) {
  state.currentFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderTasks();
}

function renderTasks() {
  const list = document.getElementById('task-list');
  const empty = document.getElementById('task-empty');
  if (!list) return;

  let filtered = state.tasks;
  if (state.currentFilter === 'done') filtered = state.tasks.filter(t => t.done);
  else if (state.currentFilter !== 'all') filtered = state.tasks.filter(t => t.priority === state.currentFilter && !t.done);

  // Remove old task items
  list.querySelectorAll('.task-item').forEach(el => el.remove());

  if (filtered.length === 0) {
    if (empty) empty.style.display = 'block';
    return;
  }
  if (empty) empty.style.display = 'none';

  const priorityOrder = { critical: 0, important: 1, optional: 2 };
  filtered.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  filtered.forEach(task => {
    const el = createTaskEl(task);
    list.appendChild(el);
  });
}

function createTaskEl(task) {
  const div = document.createElement('div');
  div.className = `task-item priority-border-${task.priority}${task.done ? ' done' : ''}`;
  div.id = 'task-' + task.id;

  const labelMap = { critical: '🔴 Critical', important: '🟡 Important', optional: '🟢 Optional' };
  const classMap = { critical: 'priority-critical', important: 'priority-important', optional: 'priority-optional' };

  div.innerHTML = `
    <button class="task-check ${task.done ? 'checked' : ''}" onclick="toggleTask(${task.id})">${task.done ? '<i class="ri-check-line"></i>' : ''}</button>
    <span class="task-priority-tag ${classMap[task.priority]}">${labelMap[task.priority]}</span>
    <span class="task-item-text">${escHtml(task.text)}</span>
    <button class="task-delete-btn" onclick="deleteTask(${task.id})" title="Delete"><i class="ri-delete-bin-6-line"></i></button>
  `;
  return div;
}

function escHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Dashboard Preview ──
function renderDashboardPreview() {
  const container = document.getElementById('dash-task-preview');
  if (!container) return;
  const top = state.tasks.filter(t => !t.done).slice(0, 5);
  container.innerHTML = '';
  if (top.length === 0) {
    container.innerHTML = '<p class="empty-state">No pending tasks. Great job!</p>';
    return;
  }
  top.forEach(task => {
    const el = createTaskEl(task);
    container.appendChild(el);
  });
}

// ══════════════════════════
// MENTAL LOAD
// ══════════════════════════
function updateMentalLoad() {
  const weights = { critical: 3, important: 2, optional: 1 };
  const maxLoad = 30; // 10 critical tasks = 100%
  let load = 0;
  state.tasks.filter(t => !t.done).forEach(t => { load += weights[t.priority] || 1; });
  const pct = Math.min(Math.round((load / maxLoad) * 100), 100);

  // Main meter
  const fill = document.getElementById('ml-meter-fill');
  const pctEl = document.getElementById('ml-percent');
  const badge = document.getElementById('ml-badge');
  const tip = document.getElementById('ml-tip');

  // Sidebar mini
  const sidebarFill = document.getElementById('sidebar-ml-fill');
  const sidebarVal = document.getElementById('sidebar-ml-val');

  const color = pct < 35 ? 'var(--accent)' : pct < 65 ? '#f5a623' : '#E84040';
  const status = pct < 35 ? 'Relaxed' : pct < 65 ? 'Moderate' : pct < 85 ? 'Heavy' : 'Overloaded';
  const tipMsg = pct < 35 ? 'Good load. Focus on priorities.' : pct < 65 ? 'Manageable. Keep going.' : pct < 85 ? 'Consider delegating some tasks.' : '⚠ Too much! Focus on critical only.';

  if (fill) { fill.style.width = pct + '%'; fill.style.background = color; }
  if (pctEl) pctEl.textContent = pct + '% Cognitive Load';
  if (badge) badge.textContent = status;
  if (tip) tip.textContent = tipMsg;
  if (sidebarFill) { sidebarFill.style.width = pct + '%'; sidebarFill.style.background = color; }
  if (sidebarVal) sidebarVal.textContent = pct + '%';
}

// ══════════════════════════
// TIMER
// ══════════════════════════
const RING_CIRC = 2 * Math.PI * 88; // = 552.9

function initTimerRing() {
  const ring = document.getElementById('ring-fill');
  if (ring) ring.style.strokeDasharray = RING_CIRC;
  updateRing();
  updateTimerDisplay();
}

function updateTimerDisplay() {
  const mins = Math.floor(state.timerSeconds / 60);
  const secs = state.timerSeconds % 60;
  const str = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  const el = document.getElementById('timer-display');
  const fo = document.getElementById('fo-timer');
  if (el) el.textContent = str;
  if (fo) fo.textContent = str;
}

function updateRing() {
  const ring = document.getElementById('ring-fill');
  if (!ring) return;
  const progress = state.timerSeconds / state.timerTotal;
  ring.style.strokeDashoffset = RING_CIRC * (1 - progress);
}

function toggleTimer() {
  if (state.timerRunning) {
    pauseTimer();
  } else {
    startTimer();
  }
}

function startTimer() {
  state.timerRunning = true;
  document.getElementById('btn-start').innerHTML = '<i class="ri-pause-fill"></i> Pause';
  state.timerInterval = setInterval(() => {
    if (state.timerSeconds <= 0) {
      completeSession();
      return;
    }
    state.timerSeconds--;
    updateTimerDisplay();
    updateRing();
  }, 1000);
}

function pauseTimer() {
  state.timerRunning = false;
  document.getElementById('btn-start').innerHTML = '<i class="ri-play-fill"></i> Start';
  clearInterval(state.timerInterval);
}

function resetTimer() {
  pauseTimer();
  state.timerSeconds = state.timerTotal;
  updateTimerDisplay();
  updateRing();
}

function skipPhase() {
  completeSession();
}

function setPhase(mins, label, btn) {
  pauseTimer();
  state.timerTotal = mins * 60;
  state.timerSeconds = mins * 60;
  state.currentPhaseLabel = label;
  document.getElementById('focus-mode-label').textContent = label;
  document.getElementById('fo-phase').textContent = label;
  document.querySelectorAll('.phase-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  document.getElementById('btn-start').textContent = '▶ Start';
  updateTimerDisplay();
  updateRing();
}

function completeSession() {
  pauseTimer();
  const minsCompleted = Math.round((state.timerTotal - state.timerSeconds) / 60);
  if (minsCompleted >= 1) {
    state.sessions++;
    state.totalFocusMinutes += minsCompleted;
    const goal = document.getElementById('session-goal').value.trim() || 'Untitled session';
    const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    state.sessionHistory.unshift({ goal, mins: minsCompleted, time: now, date: new Date().toLocaleDateString() });
    saveState();
    renderStats();
    renderSessionLog();
  }
  if (state.fullFocus) exitFullFocus();
  state.timerSeconds = state.timerTotal;
  updateTimerDisplay();
  updateRing();
  document.getElementById('btn-start').textContent = '▶ Start';
}

// ── Full Focus Overlay ──
function exitFullFocus() {
  state.fullFocus = false;
  document.getElementById('focus-overlay').classList.remove('active');
}

// ── Session Log ──
function renderSessionLog() {
  const log = document.getElementById('session-log');
  if (!log) return;
  if (state.sessionHistory.length === 0) {
    log.innerHTML = '<p class="empty-state">No sessions yet.</p>';
    return;
  }
  log.innerHTML = state.sessionHistory.slice(0, 5).map(s =>
    `<div class="session-log-item"><i class="ri-checkbox-circle-line"></i> ${escHtml(s.goal)} — ${s.mins} min</div>`
  ).join('');
}

// ══════════════════════════
// STATS
// ══════════════════════════
function renderStats() {
  const done = state.tasks.filter(t => t.done).length;
  const total = state.tasks.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const timeStr = state.totalFocusMinutes >= 60
    ? `${Math.floor(state.totalFocusMinutes / 60)}h ${state.totalFocusMinutes % 60}m`
    : state.totalFocusMinutes + ' min';

  // Dashboard
  setEl('dash-sessions', state.sessions);
  setEl('dash-time', timeStr);
  setEl('dash-tasks', done);
  setEl('dash-streak', calcStreak());

  // Stats page
  setEl('stat-sessions', state.sessions);
  setEl('stat-time', timeStr);
  setEl('stat-tasks-done', done);
  setEl('stat-tasks-total', total);
  setEl('completion-rate-text', pct + '% of tasks completed');

  const bar = document.getElementById('completion-bar-fill');
  if (bar) bar.style.width = pct + '%';

  renderSessionHistory();
}

function calcStreak() {
  if (state.sessionHistory.length === 0) return 0;
  const days = new Set(state.sessionHistory.map(s => s.date));
  return days.size;
}

function renderSessionHistory() {
  const list = document.getElementById('session-history-list');
  if (!list) return;
  if (state.sessionHistory.length === 0) {
    list.innerHTML = '<p class="empty-state">Complete a focus session to see it here.</p>';
    return;
  }
  list.innerHTML = state.sessionHistory.map(s => `
    <div class="history-item">
      <div>
        <div style="font-weight:600;color:var(--text);margin-bottom:2px;">${escHtml(s.goal)}</div>
        <div class="history-item-meta">${s.date}</div>
      </div>
      <div style="text-align:right;">
        <div style="font-weight:600;color:var(--accent);">${s.mins} min</div>
        <div class="history-item-meta">${s.time}</div>
      </div>
    </div>
  `).join('');
}

function clearHistory() {
  if (!confirm('Clear all session history?')) return;
  state.sessionHistory = [];
  state.sessions = 0;
  state.totalFocusMinutes = 0;
  saveState();
  renderStats();
}

function setEl(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}
