import { describe, expect, it } from 'vitest'
import type { WorkoutDayExercise } from '../core/types'
import { describeExercise, getExerciseRowControls } from './exerciseRows'

const IDLE = { active: false, resting: false, remaining: 0 }

/**
 * Builds a scheduled exercise with the given sets.
 * @param overrides - Fields to change from the defaults.
 * @returns The exercise.
 */
function exercise(overrides: Partial<WorkoutDayExercise> = {}): WorkoutDayExercise {
  return { id: 'squat-1', name: 'Back Squat', category: 'legs', sets: 3, reps: 8, weight: 35, duration: 50, rest: 75, ...overrides }
}

describe('describeExercise', () => {
  it('joins sets, reps, load and rest with bullets, and handles failure and bodyweight', () => {
    expect(describeExercise(exercise())).toBe('3 sets • 8 reps • 35 kg • 75s rest')
    expect(describeExercise(exercise({ repsTillFailure: true, bodyWeight: true, rest: 0 }))).toBe("3 sets • 'Till Failure • Body Weight • 60s rest")
  })
})

describe('getExerciseRowControls', () => {
  it('labels the start button by set for a multi-set exercise and the Complete button when idle', () => {
    const controls = getExerciseRowControls(exercise({ currentSet: 2 }), IDLE)
    expect(controls).toMatchObject({ startLabel: 'Start Set 2/3', startDisabled: false, completeLabel: 'Complete', completed: false, skipVisible: false })
  })

  it('shows the rest countdown and the skip button while resting', () => {
    const controls = getExerciseRowControls(exercise({ currentSet: 2 }), { active: true, resting: true, remaining: 65 })
    expect(controls).toMatchObject({ startLabel: 'Rest 01:05', startDisabled: true, resting: true, skipVisible: true })
  })

  it('marks a completed exercise as completed and disables its start button', () => {
    const controls = getExerciseRowControls(exercise({ sets: 1, completed: true }), IDLE)
    expect(controls).toMatchObject({ startLabel: 'Completed ✓', startDisabled: true, completeLabel: 'Completed ✓', completed: true })
  })
})
