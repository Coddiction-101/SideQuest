import test from 'node:test'
import assert from 'node:assert/strict'
import { currentStreak, localDateKey, parseLocalDate, previousDate } from '../src/utils/dates.js'
import { moveTask } from '../src/utils/tasks.js'
import { countdownParts, formatClock, stopwatchElapsed, timerRemaining } from '../src/utils/time.js'
import { lifeProgress, timeProgress } from '../src/utils/progress.js'
import { initialData, validData } from '../src/storage/data.js'

test('local dates handle leap days and year boundaries', () => {
  assert.equal(localDateKey(new Date(2026, 11, 31, 23, 59)), '2026-12-31')
  assert.equal(previousDate('2027-01-01'), '2026-12-31')
  assert.equal(previousDate('2028-03-01'), '2028-02-29')
  assert.equal(parseLocalDate('2026-02-29'), null)
  assert.equal(parseLocalDate('2026-13-01'), null)
})

test('streaks allow an unfinished today, break on a missed day, and ignore duplicates and future dates', () => {
  assert.equal(currentStreak([], '2026-09-10'), 0)
  assert.equal(currentStreak(['2026-09-08', '2026-09-09'], '2026-09-10'), 2)
  assert.equal(currentStreak(['2026-09-08', '2026-09-09', '2026-09-10'], '2026-09-10'), 3)
  assert.equal(currentStreak(['2026-09-08'], '2026-09-10'), 0)
  assert.equal(currentStreak(['2026-09-10', '2026-09-10', '2026-09-11'], '2026-09-10'), 1)
  assert.equal(currentStreak(['2028-02-28', '2028-02-29', '2028-03-01'], '2028-03-01'), 3)
})

test('reordering preserves item identity and protects boundaries', () => {
  const tasks = [{ id: 'a', completed: true }, { id: 'b', completed: false }]
  const result = moveTask(tasks, 'b', -1)
  assert.deepEqual(result.map(item => item.id), ['b', 'a'])
  assert.equal(result[1], tasks[0])
  assert.equal(moveTask(tasks, 'a', -1), tasks)
  assert.equal(moveTask(tasks, 'b', 1), tasks)
  assert.equal(moveTask(tasks, 'missing', 1), tasks)
  assert.deepEqual(tasks.map(item => item.id), ['a', 'b'])
})

test('clocks use elapsed wall time and never go below zero', () => {
  assert.equal(timerRemaining({ remaining: 5000, endsAt: null }, 20000), 5000)
  assert.equal(timerRemaining({ remaining: 5000, endsAt: 30000 }, 28000), 2000)
  assert.equal(timerRemaining({ remaining: 5000, endsAt: 30000 }, 60000), 0)
  assert.equal(stopwatchElapsed({ elapsed: 5000, startedAt: 10000 }, 20000), 15000)
  assert.equal(stopwatchElapsed({ elapsed: 5000, startedAt: null }, 20000), 5000)
  assert.equal(formatClock(1499999, true), '25:00')
  assert.equal(formatClock(3661000), '1:01:01')
  assert.deepEqual(countdownParts(90061000, 0), [1, 1, 1, 1])
  assert.deepEqual(countdownParts(1000, 2000), [0, 0, 0, 0])
})

test('progress handles midnight, leap years, birthdays and estimates beyond 100%', () => {
  const jan = timeProgress(new Date(2028, 0, 1).getTime())
  assert.equal(jan[0].percent, 0)
  assert.equal(jan[1].percent, 0)
  assert.equal(jan[2].percent, 0)
  assert.match(jan[2].detail, /366/)
  const march = timeProgress(new Date(2028, 2, 1).getTime())
  assert.equal(march[1].percent, 0)
  assert.match(march[2].detail, /^60 of 366/)
  assert.equal(lifeProgress('2000-09-10', 80, new Date(2026, 8, 9).getTime()).age, 25)
  assert.equal(lifeProgress('2000-09-10', 80, new Date(2026, 8, 10).getTime()).age, 26)
  assert.equal(lifeProgress('2000-02-29', 80, new Date(2027, 1, 28).getTime()).age, 27)
  assert.equal(lifeProgress('1900-01-01', 80, new Date(2026, 0, 1).getTime()).percent, 100)
})

test('stored data is validated before being rendered', () => {
  assert.ok(validData(initialData))
  assert.equal(Boolean(validData(null)), false)
  assert.equal(Boolean(validData({ ...initialData, habits: [null] })), false)
  assert.equal(Boolean(validData({ ...initialData, life: { birthDate: 'oops', lifespan: 80 } })), false)
  assert.equal(Boolean(validData({ ...initialData, tasksByDay: { '2026-02-30': [] } })), false)
})
