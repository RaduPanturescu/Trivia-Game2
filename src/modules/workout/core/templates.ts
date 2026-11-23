import { isoDate } from '@/shared/dates'
import { cloneWorkoutExercises } from './catalog'
import { getMonday, getWorkoutDayIndex, isUntrackedWorkoutDay } from './schedule'
import type { WorkoutDay, WorkoutDayExercise, WorkoutProgram, WorkoutTemplate, WorkoutTemplateExercise, WorkoutWeeklyTemplates, WorkoutWeek } from './types'

/**
 * Strips the per-day fields (id, completion, set progress) from a day exercise, keeping everything else.
 * @param exercise - A day exercise. Not modified.
 * @returns The exercise as stored in a template.
 */
function toTemplateExercise(exercise: WorkoutDayExercise): WorkoutTemplateExercise {
  const details: Partial<WorkoutDayExercise> = { ...exercise }
  delete details.id
  delete details.completed
  delete details.currentSet
  return details as WorkoutTemplateExercise
}

/**
 * Builds the weekly template a day would save: its type and exercises without per-day fields.
 * @param day - The day to copy from.
 * @returns A new template.
 */
export function createWorkoutDayTemplate(day: WorkoutDay): WorkoutTemplate {
  return { type: day.type, exercises: day.exercises.map(toTemplateExercise) }
}

/**
 * Overwrites a day with a template: type, copied exercises, and all progress and manual marks cleared.
 * @param day - The day to change in place.
 * @param template - The template to copy from.
 */
export function applyWorkoutTemplateToDay(day: WorkoutDay, template: WorkoutTemplate): void {
  day.type = template.type
  day.exercises = template.type === 'workout' ? cloneWorkoutExercises(template.exercises, day.date) : []
  day.completed = false
  day.manualCompleted = false
  day.manualMissed = false
  delete day.untrackedWorkout
  delete day.savedExercisesForWorkout
}

/**
 * The template set that every weekday is a rest day, used when a program starts over.
 * @returns Templates for indexes `0`..`6`, all rest.
 */
export function createRestWeeklyTemplates(): WorkoutWeeklyTemplates {
  return Object.fromEntries(Array.from({ length: 7 }, (_, index) => [index, { type: 'rest', exercises: [] }]))
}

/**
 * Records a day's shape as the weekday template, then copies it onto future days of that weekday that have no progress.
 * Past days are not used as templates, except for the current week before the program start.
 * @param templates - The weekly templates. Updated in place.
 * @param program - The program. Future days are updated in place.
 * @param programStartDate - The program start as `YYYY-MM-DD`, or `null` when unknown.
 * @param day - The edited day.
 * @param dayIndex - The weekday index of `day` (Monday = 0).
 * @param now - The current time.
 */
export function saveWorkoutDayTemplate(
  templates: WorkoutWeeklyTemplates,
  program: WorkoutProgram,
  programStartDate: string | null,
  day: WorkoutDay,
  dayIndex: number,
  now: Date = new Date(),
): void {
  const today = isoDate(now)
  const isCurrentWeekBeforeProgram = !!programStartDate && day.date < programStartDate
    && isoDate(getMonday(day.date)) === isoDate(getMonday(now))
  if (day.date < today && !isCurrentWeekBeforeProgram) return

  templates[dayIndex] = createWorkoutDayTemplate(day)
  const template = templates[dayIndex]
  if (!template) return
  for (const week of program.weeks) {
    const futureDay = week.days.find((candidate) => candidate.date > day.date && candidate.date >= today && getWorkoutDayIndex(candidate.date) === dayIndex)
    if (futureDay && !futureDay.manualCompleted && !futureDay.manualMissed
      && !futureDay.exercises.some((exercise) => exercise.completed || Number(exercise.currentSet || 1) > 1)) {
      applyWorkoutTemplateToDay(futureDay, template)
    }
  }
}

/**
 * Saves a template for every weekday of `week` that does not have one yet, copying the week's current shape.
 * @param templates - The weekly templates. Updated in place.
 * @param week - The week to copy from.
 * @returns `true` when at least one template was added.
 */
export function ensureWeeklyTemplates(templates: WorkoutWeeklyTemplates, week: WorkoutWeek): boolean {
  let changed = false
  week.days.forEach((day, index) => {
    if (templates[index]) return
    templates[index] = createWorkoutDayTemplate(day)
    changed = true
  })
  return changed
}

/**
 * One-time repair for programs started before the template fix: rest-template days of the program's first week
 * that were untracked workouts get their template rewritten. Runs once; the caller stores the migration flag.
 * @param templates - The weekly templates. Updated in place.
 * @param program - The program. Updated in place.
 * @param programStartDate - The program start as `YYYY-MM-DD`, or `null`.
 * @param now - The current time.
 */
export function repairPreStartWorkoutTemplates(
  templates: WorkoutWeeklyTemplates,
  program: WorkoutProgram,
  programStartDate: string | null,
  now: Date = new Date(),
): void {
  if (!programStartDate) return
  const currentWeekStart = isoDate(getMonday(now))
  if (isoDate(getMonday(programStartDate)) !== currentWeekStart) return
  const week = program.weeks.find((item) => item.weekStart === currentWeekStart)
  const days = week?.days ?? []
  days.forEach((day, index) => {
    if (day.date < programStartDate && day.type === 'workout' && day.untrackedWorkout === undefined
      && isUntrackedWorkoutDay(day, programStartDate) && templates[index]?.type === 'rest') {
      saveWorkoutDayTemplate(templates, program, programStartDate, day, index, now)
    }
  })
}
