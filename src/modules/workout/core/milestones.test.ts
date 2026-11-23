import { beforeEach, describe, expect, it, vi } from 'vitest'
import { checkWorkoutMilestones } from './milestones'
import type { WorkoutDay, WorkoutDayExercise, WorkoutProgram } from './types'

const mocks = vi.hoisted(() => ({ unlock: vi.fn() }))

vi.mock('@/shared/achievements', () => ({ useAchievements: () => ({ unlock: mocks.unlock }) }))

/** Builds a workout day with `total` exercises, the first `done` of them completed. */
function day(done: number, total: number, type: WorkoutDay['type'] = 'workout'): WorkoutDay {
  const exercises: WorkoutDayExercise[] = Array.from({ length: total }, (_, index) => ({
    id: `ex-${index}`,
    name: `Exercise ${index}`,
    category: 'chest',
    sets: 3,
    reps: 10,
    weight: 0,
    duration: 30,
    rest: 60,
    completed: index < done,
  }))
  return { date: '2026-11-23', dayLabel: 'Mon', type, exercises, completed: false }
}

/** Wraps days in one week of a program. */
function programOf(...days: WorkoutDay[]): WorkoutProgram {
  return { currentWeekStart: '2026-11-23', weeks: [{ weekStart: '2026-11-23', days }] }
}

/** Ids passed to `unlock`, in call order. */
function unlockedIds(): string[] {
  return mocks.unlock.mock.calls.map((call) => call[0] as string)
}

describe('checkWorkoutMilestones', () => {
  beforeEach(() => mocks.unlock.mockClear())

  it('unlocks nothing for an empty program', () => {
    checkWorkoutMilestones(programOf(day(0, 0)))
    expect(unlockedIds()).toEqual([])
  })

  it('unlocks firstWorkout once a day is completed, not for a rest day', () => {
    checkWorkoutMilestones(programOf(day(0, 0, 'rest'), day(2, 4)))
    expect(unlockedIds()).toEqual(['firstWorkout'])
  })

  it('counts completed exercises across all weeks and unlocks each reached threshold', () => {
    const program: WorkoutProgram = {
      currentWeekStart: '2026-11-23',
      weeks: [
        { weekStart: '2026-11-23', days: [day(3, 3), day(0, 0, 'rest')] },
        { weekStart: '2026-11-16', days: [day(2, 2), day(0, 0)] },
      ],
    }
    checkWorkoutMilestones(program)
    expect(unlockedIds()).toEqual(['firstWorkout', 'workout3', 'workout5'])
  })

  it('unlocks the 30 exercise milestone at the top threshold', () => {
    checkWorkoutMilestones(programOf(day(30, 30)))
    expect(unlockedIds()).toEqual(['firstWorkout', 'workout3', 'workout5', 'workout10', 'workout15', 'workout30'])
  })
})
