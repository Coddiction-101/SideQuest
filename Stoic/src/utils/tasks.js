export function moveTask(tasks, id, direction) {
  const index = tasks.findIndex((task) => task.id === id)
  const nextIndex = index + direction
  if (index === -1 || nextIndex < 0 || nextIndex >= tasks.length) return tasks

  const reordered = [...tasks]
  ;[reordered[index], reordered[nextIndex]] = [reordered[nextIndex], reordered[index]]
  return reordered
}

export function reorderTask(tasks, sourceId, targetId) {
  const source = tasks.findIndex(task => task.id === sourceId)
  const target = tasks.findIndex(task => task.id === targetId)
  if (source < 0 || target < 0 || source === target) return tasks
  const reordered = [...tasks]
  const [task] = reordered.splice(source, 1)
  reordered.splice(target, 0, task)
  return reordered
}

export function restoreItem(items, item, index) {
  if (items.some(current => current.id === item.id)) return items
  const result = [...items]
  result.splice(Math.min(index, result.length), 0, item)
  return result
}
