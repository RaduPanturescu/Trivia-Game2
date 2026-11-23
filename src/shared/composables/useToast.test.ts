import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useToast } from './useToast'

const { playSfx } = vi.hoisted(() => ({ playSfx: vi.fn() }))

vi.mock('./useAudio', () => ({
  SFX: { pop: '/assets/pop_sound.wav' },
  useAudio: () => ({ playSfx }),
}))

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    // The queue is module-level state, so drain pending removals between tests.
    vi.runAllTimers()
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('adds a toast and plays the pop sound', () => {
    const { toasts, show } = useToast()
    show({ title: 'Hi', message: 'There' })
    expect(toasts.value).toHaveLength(1)
    expect(toasts.value[0]).toMatchObject({ title: 'Hi', message: 'There', variant: 'default' })
    expect(playSfx).toHaveBeenCalledWith('/assets/pop_sound.wav')
  })

  it('removes a default toast after 4500ms', () => {
    const { toasts, show } = useToast()
    show({ title: 'Hi', message: 'There' })
    vi.advanceTimersByTime(4499)
    expect(toasts.value).toHaveLength(1)
    vi.advanceTimersByTime(1)
    expect(toasts.value).toHaveLength(0)
  })

  it('removes a task toast after 6500ms', () => {
    const { toasts, show } = useToast()
    show({ title: 'Task', message: 'Done', variant: 'task' })
    vi.advanceTimersByTime(6499)
    expect(toasts.value).toHaveLength(1)
    vi.advanceTimersByTime(1)
    expect(toasts.value).toHaveLength(0)
  })

  it('shows Maya toasts silently and removes them after 2500ms', () => {
    const { toasts, show } = useToast()
    show({ title: 'Maya!', message: 'Clicked', variant: 'maya' })
    expect(playSfx).not.toHaveBeenCalled()
    vi.advanceTimersByTime(2500)
    expect(toasts.value).toHaveLength(0)
  })

  it('honours an explicit duration and removes only its own toast', () => {
    const { toasts, show } = useToast()
    show({ title: 'Short', message: 'a', duration: 1000 })
    show({ title: 'Long', message: 'b', duration: 3000 })
    vi.advanceTimersByTime(1000)
    expect(toasts.value.map((toast) => toast.title)).toEqual(['Long'])
  })
})
