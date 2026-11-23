import { getCurrentScope, onScopeDispose, ref, type Ref } from 'vue'

/** How often the displayed time is refreshed from the wall clock. */
const TICK_MS = 100

/** Public surface of a game timer returned by {@link useGameTimer}. */
export interface GameTimer {
  /** Whole seconds elapsed since the last reset, measured against the wall clock. */
  seconds: Ref<number>
  /** Whether the timer is currently counting. */
  running: Ref<boolean>
  /** Starts counting from the current `seconds` value. Does nothing if already running. */
  start: () => void
  /** Pauses counting and freezes `seconds`. */
  stop: () => void
  /** Stops counting and sets `seconds` back to zero. */
  reset: () => void
}

/**
 * Creates a per-call stopwatch that measures wall-clock time, as the legacy minesweeper timer does.
 * The interval is cleared when the calling component or effect scope is disposed.
 * @returns A new {@link GameTimer}.
 */
export function useGameTimer(): GameTimer {
  const seconds = ref(0)
  const running = ref(false)
  let handle: ReturnType<typeof setInterval> | undefined
  let startedAt = 0

  function start(): void {
    if (running.value) return
    running.value = true
    startedAt = Date.now() - seconds.value * 1000
    handle = setInterval(() => {
      seconds.value = Math.floor((Date.now() - startedAt) / 1000)
    }, TICK_MS)
  }

  function stop(): void {
    if (handle !== undefined) clearInterval(handle)
    handle = undefined
    running.value = false
  }

  function reset(): void {
    stop()
    seconds.value = 0
  }

  if (getCurrentScope()) onScopeDispose(stop)

  return { seconds, running, start, stop, reset }
}
