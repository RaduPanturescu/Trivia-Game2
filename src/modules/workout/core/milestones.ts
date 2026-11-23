import { useAchievements } from '@/shared/achievements'
import { isWorkoutDayCompleted } from './schedule'
import type { WorkoutProgram } from './types'

/** Completed-exercise totals that unlock each milestone, in legacy order. */
const EXERCISE_MILESTONES: ReadonlyArray<readonly [id: string, exercises: number]> = [
  ['workout3', 3],
  ['workout5', 5],
  ['workout10', 10],
  ['workout15', 15],
  ['workout30', 30],
]

/**
 * Unlocks the workout milestones the program has reached: the first completed day, and total completed
 * exercises across all weeks. Already unlocked milestones are left alone. Legacy `updateWorkoutAchievements`.
 * @param program - The workout program to check.
 */
export function checkWorkoutMilestones(program: WorkoutProgram): void {
  const days = program.weeks.flatMap((week) => week.days)
  const completedExercises = days.reduce((total, day) => total + (day.exercises ?? []).filter((exercise) => exercise.completed).length, 0)
  const completedDays = days.filter((day) => isWorkoutDayCompleted(day)).length

  const achievements = useAchievements()
  if (completedDays >= 1) achievements.unlock('firstWorkout')
  for (const [id, exercises] of EXERCISE_MILESTONES) {
    if (completedExercises >= exercises) achievements.unlock(id)
  }
}
