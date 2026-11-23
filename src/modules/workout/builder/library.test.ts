import { describe, expect, it } from 'vitest'
import type { WorkoutLibraryExercise } from '../core/types'
import {
  clampExerciseListHeight,
  filterExercises,
  formatExerciseMeta,
  isCustomExerciseId,
  listCategoryChips,
  matchesExerciseType,
  resolveExerciseListHeight,
} from './library'

/** Builds a library exercise with defaults for the fields the filters do not look at. */
function exercise(overrides: Partial<WorkoutLibraryExercise> & Pick<WorkoutLibraryExercise, 'id' | 'category'>): WorkoutLibraryExercise {
  return { name: overrides.id, sets: 3, reps: 10, weight: 20, duration: 45, rest: 60, ...overrides }
}

const bench = exercise({ id: 'bench-press', category: 'chest', weight: 20 })
const pushUp = exercise({ id: 'push-up', category: 'upper body', weight: 0, bodyWeight: true })
const legacyPlank = exercise({ id: 'plank', category: 'core', weight: 0 })
const customRow = exercise({ id: 'custom-1', category: 'back', weight: 30 })
const LIBRARY = [bench, pushUp, legacyPlank, customRow]

describe('resolveExerciseListHeight and clampExerciseListHeight', () => {
  it('uses the legacy default when nothing usable is stored', () => {
    expect(resolveExerciseListHeight(0)).toBe(380)
    expect(resolveExerciseListHeight(Number.NaN)).toBe(380)
    expect(resolveExerciseListHeight(-5)).toBe(380)
  })

  it('keeps heights between 300 and 600 pixels and rounds them', () => {
    expect(resolveExerciseListHeight(120)).toBe(300)
    expect(resolveExerciseListHeight(900)).toBe(600)
    expect(clampExerciseListHeight(412.6)).toBe(413)
  })
})

describe('matchesExerciseType', () => {
  it('uses the explicit bodyweight flag before the weight', () => {
    expect(matchesExerciseType(pushUp, 'bodyweight')).toBe(true)
    expect(matchesExerciseType(pushUp, 'weighted')).toBe(false)
  })

  it('treats a zero load without a flag as bodyweight, as legacy did', () => {
    expect(matchesExerciseType(legacyPlank, 'bodyweight')).toBe(true)
    expect(matchesExerciseType(bench, 'weighted')).toBe(true)
  })

  it('lists everything with the all filter', () => {
    expect(matchesExerciseType(bench, 'all')).toBe(true)
  })
})

describe('filterExercises', () => {
  it('combines the type filter with the category', () => {
    expect(filterExercises(LIBRARY, 'bodyweight', 'upper body').map((item) => item.id)).toEqual(['push-up'])
    expect(filterExercises(LIBRARY, 'weighted', 'all').map((item) => item.id)).toEqual(['bench-press', 'custom-1'])
  })

  it('keeps the library order', () => {
    expect(filterExercises(LIBRARY, 'all', 'all').map((item) => item.id)).toEqual(['bench-press', 'push-up', 'plank', 'custom-1'])
  })
})

describe('listCategoryChips', () => {
  it('offers library categories first, then the saved list, without duplicates', () => {
    expect(listCategoryChips(LIBRARY, ['chest', 'legs', 'back'], 'all')).toEqual(['chest', 'upper body', 'core', 'back', 'legs'])
  })

  it('keeps only categories with a matching exercise under a type filter', () => {
    expect(listCategoryChips(LIBRARY, ['chest', 'legs'], 'bodyweight')).toEqual(['upper body', 'core'])
  })
})

describe('formatExerciseMeta', () => {
  it('shows sets, reps and the weight in kg', () => {
    expect(formatExerciseMeta(bench)).toBe('3 sets • 10 reps • 20kg')
  })

  it('shows body weight and till failure instead of reps and kg', () => {
    expect(formatExerciseMeta(pushUp)).toBe('3 sets • 10 reps • Body Weight')
    expect(formatExerciseMeta({ ...bench, reps: 0, repsTillFailure: true })).toBe("3 sets • 'Till Failure • 20kg")
  })
})

describe('isCustomExerciseId', () => {
  it('recognises the custom id prefix', () => {
    expect(isCustomExerciseId('custom-1700000000000')).toBe(true)
    expect(isCustomExerciseId('bench-press')).toBe(false)
  })
})
