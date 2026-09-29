// Tracks how many requests are currently waiting for the sleeping backend to wake up,
// so the UI can show a single "waking up" banner no matter how many requests are retrying.
let wakingCount = 0
const listeners = new Set()

function notify() {
  listeners.forEach((listener) => listener())
}

export function startWaking() {
  wakingCount += 1
  if (wakingCount === 1) notify()
}

export function stopWaking() {
  wakingCount -= 1
  if (wakingCount === 0) notify()
}

// For useSyncExternalStore
export function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const isServerWaking = () => wakingCount > 0
