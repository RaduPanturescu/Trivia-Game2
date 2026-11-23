import { describe, expect, it } from 'vitest'
import { indexAfterMove, reorderExercise } from './session'
import type { WorkoutDay, WorkoutDayExercise } from './types'

/** A day holding exercises with the given names, in order. */
function dayWith(names: string[]): WorkoutDay {
  const exercises: WorkoutDayExercise[] = names.map((name) => ({
    id: `${name}-id`, name, category: 'legs', sets: 3, reps: 8, weight: 0, duration: 45, rest: 60,
  }))
  return { date: '2026-11-25', dayLabel: 'Wed', type: 'workout', exercises, completed: false }
}

/** Names of the day's exercises, in order. */
function names(day: WorkoutDay): string[] {
  return day.exercises.map((exercise) => exercise.name)
}

describe('reorderExercise', () => {
  it('moves an exercise down and up', () => {
    const day = dayWith(['A', 'B', 'C', 'D'])
    expect(reorderExercise(day, 0, 2)).toBe(true)
    expect(names(day)).toEqual(['B', 'C', 'A', 'D'])
    expect(reorderExercise(day, 3, 0)).toBe(true)
    expect(names(day)).toEqual(['D', 'B', 'C', 'A'])
  })

  it('refuses a move that changes nothing or uses a bad index', () => {
    const day = dayWith(['A', 'B'])
    expect(reorderExercise(day, 1, 1)).toBe(false)
    expect(reorderExercise(day, -1, 0)).toBe(false)
    expect(reorderExercise(day, 0, 2)).toBe(false)
    expect(reorderExercise(day, 0.5, 1)).toBe(false)
    expect(names(day)).toEqual(['A', 'B'])
  })
})

describe('indexAfterMove', () => {
  it('follows the moved exercise and shifts the ones it passes', () => {
    // A (0) moves to 2: B and C each shift up by one.
    expect(indexAfterMove(0, 0, 2)).toBe(2)
    expect(indexAfterMove(1, 0, 2)).toBe(0)
    expect(indexAfterMove(2, 0, 2)).toBe(1)
    expect(indexAfterMove(3, 0, 2)).toBe(3)
    // D (3) moves to 1: B and C shift down by one.
    expect(indexAfterMove(3, 3, 1)).toBe(1)
    expect(indexAfterMove(1, 3, 1)).toBe(2)
    expect(indexAfterMove(2, 3, 1)).toBe(3)
    expect(indexAfterMove(0, 3, 1)).toBe(0)
  })

  it('tracks every exercise through every move of a four-exercise day', () => {
    for (let from = 0; from < 4; from++) {
      for (let to = 0; to < 4; to++) {
        if (from === to) continue
        const day = dayWith(['A', 'B', 'C', 'D'])
        reorderExercise(day, from, to)
        const original = ['A', 'B', 'C', 'D']
        original.forEach((name, index) => {
          expect(day.exercises[indexAfterMove(index, from, to)]?.name).toBe(name)
        })
      }
    }
  })
})
