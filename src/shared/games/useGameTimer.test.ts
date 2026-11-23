import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope } from 'vue'
import { useGameTimer } from './useGameTimer'

describe('useGameTimer', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('counts whole seconds of wall-clock time once started', () => {
    const timer = useGameTimer()
    timer.start()
    expect(timer.running.value).toBe(true)
    vi.advanceTimersByTime(3500)
    expect(timer.seconds.value).toBe(3)
  })

  it('does not drift: a second is only counted once the wall clock reaches it', () => {
    const timer = useGameTimer()
    timer.start()
    vi.advanceTimersByTime(999)
    expect(timer.seconds.value).toBe(0)
    vi.advanceTimersByTime(1)
    expect(timer.seconds.value).toBe(1)
  })

  it('freezes the value when stopped and resumes from it', () => {
    const timer = useGameTimer()
    timer.start()
    vi.advanceTimersByTime(2000)
    timer.stop()
    vi.advanceTimersByTime(5000)
    expect(timer.seconds.value).toBe(2)
    expect(timer.running.value).toBe(false)
    timer.start()
    vi.advanceTimersByTime(1000)
    expect(timer.seconds.value).toBe(3)
  })

  it('reset stops the timer and returns to zero', () => {
    const timer = useGameTimer()
    timer.start()
    vi.advanceTimersByTime(4000)
    timer.reset()
    expect(timer.seconds.value).toBe(0)
    expect(timer.running.value).toBe(false)
    vi.advanceTimersByTime(3000)
    expect(timer.seconds.value).toBe(0)
  })

  it('ignores a second start call', () => {
    const timer = useGameTimer()
    timer.start()
    timer.start()
    vi.advanceTimersByTime(1000)
    expect(timer.seconds.value).toBe(1)
  })

  it('gives each call its own timer', () => {
    const first = useGameTimer()
    const second = useGameTimer()
    first.start()
    vi.advanceTimersByTime(2000)
    expect(first.seconds.value).toBe(2)
    expect(second.seconds.value).toBe(0)
  })

  it('clears the interval when its scope is disposed', () => {
    const scope = effectScope()
    const timer = scope.run(() => {
      const created = useGameTimer()
      created.start()
      return created
    })
    expect(timer).toBeDefined()
    scope.stop()
    expect(timer?.running.value).toBe(false)
    vi.advanceTimersByTime(5000)
    expect(timer?.seconds.value).toBe(0)
  })
})
