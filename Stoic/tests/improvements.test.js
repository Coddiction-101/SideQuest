import test from 'node:test'
import assert from 'node:assert/strict'
import { createBackup, parseBackup, mergeBackup } from '../src/storage/backup.js'
import { initialData } from '../src/storage/data.js'
import { reorderTask, restoreItem } from '../src/utils/tasks.js'

test('deletion undo restores the original position and never duplicates an item', () => {
  const a = { id: 'a' }, b = { id: 'b' }, c = { id: 'c' }
  assert.deepEqual(restoreItem([a, c], b, 1), [a, b, c])
  assert.deepEqual(restoreItem([a, b], b, 1), [a, b])
  assert.deepEqual(restoreItem([], c, 4), [c])
})

test('drag reorder handles moves in both directions without mutating tasks', () => {
  const tasks = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
  assert.deepEqual(reorderTask(tasks, 'a', 'c').map(item => item.id), ['b', 'c', 'a'])
  assert.deepEqual(reorderTask(tasks, 'c', 'a').map(item => item.id), ['c', 'a', 'b'])
  assert.equal(reorderTask(tasks, 'missing', 'a'), tasks)
  assert.deepEqual(tasks.map(item => item.id), ['a', 'b', 'c'])
})

test('backups round-trip and reject corrupt, incompatible or duplicate records', () => {
  assert.deepEqual(parseBackup(createBackup(initialData)), initialData)
  assert.throws(() => parseBackup('invalid'), /valid JSON/)
  assert.throws(() => parseBackup('{"app":"Other"}'), /supported/)
  const task = { id: 'a', text: 'Read', completed: false }
  assert.throws(() => parseBackup(createBackup({ ...initialData, tasksByDay: { '2026-09-10': [task, task] } })), /supported/)
})

test('restore merges history while preserving local edits and remaining idempotent', () => {
  const a = { id: 'a', text: 'Local edit', completed: true }
  const b = { id: 'b', text: 'Recovered', completed: false }
  const current = { ...initialData, theme: 'dark', tasksByDay: { '2026-09-10': [a] }, habits: [{ id: 'h', name: 'Read', completions: ['2026-09-10'] }] }
  const incoming = { ...initialData, tasksByDay: { '2026-09-10': [{ ...a, completed: false }, b], '2026-09-09': [b] }, habits: [{ id: 'h', name: 'Old name', completions: ['2026-09-09'] }] }
  const merged = mergeBackup(current, incoming)
  assert.deepEqual(merged.tasksByDay['2026-09-10'], [a, b])
  assert.equal(merged.tasksByDay['2026-09-09'].length, 1)
  assert.equal(merged.theme, 'dark')
  assert.equal(merged.habits[0].name, 'Read')
  assert.deepEqual(merged.habits[0].completions, ['2026-09-09', '2026-09-10'])
  assert.deepEqual(mergeBackup(merged, incoming), merged)
})
