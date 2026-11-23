import { describe, expect, it } from 'vitest'
import { effectScope, nextTick, ref, watch } from 'vue'
import { defineSingleton } from './singleton'

describe('defineSingleton', () => {
  it('runs the factory once and returns the same instance afterwards', () => {
    let calls = 0
    const get = defineSingleton(() => ({ id: ++calls }))
    const first = get()
    expect(get()).toBe(first)
    expect(calls).toBe(1)
  })

  it('keeps a watcher created on first call running after the component scope that asked for it stops', async () => {
    const source = ref(0)
    const seen: number[] = []
    const get = defineSingleton(() => {
      watch(source, (value) => seen.push(value))
      return source
    })

    const component = effectScope()
    component.run(() => get())
    component.stop()

    source.value = 1
    await nextTick()
    expect(seen).toEqual([1])
  })

  it('control: the same watcher made directly in a stopped component scope does not run', async () => {
    const source = ref(0)
    const seen: number[] = []
    const component = effectScope()
    component.run(() => watch(source, (value) => seen.push(value)))
    component.stop()

    source.value = 1
    await nextTick()
    expect(seen).toEqual([])
  })
})
