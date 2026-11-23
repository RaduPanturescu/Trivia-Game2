import { isoDate } from '@/shared/dates'
import { cloneWorkoutExercises } from '../core/catalog'
import { useWorkoutStore } from '../core/store'
import { useWorkoutTimer } from '../timer/useWorkoutTimer'
import { getSelectedDay } from './selectedDay'

/**
 * Turns the selected day into a rest day or a workout day, as the legacy rest toggle did. Going to rest keeps the exercises
 * aside so they come back when the day is a workout again. Going to a workout restores them, or the weekly template's
 * exercises when none were kept. The weekday template is updated afterwards. A timer running for this day is stopped.
 * @param type - `rest` or `workout`.
 */
export function setSelectedDayType(type: 'workout' | 'rest'): void {
  const store = useWorkoutStore()
  const day = getSelectedDay(store)
  if (!day) return
  const timer = useWorkoutTimer()
  if (timer.activeDayDate.value === day.date) timer.resetActive()

  if (type === 'rest') {
    day.savedExercisesForWorkout = day.exercises.map((exercise) => ({ ...exercise }))
    day.type = 'rest'
    day.exercises = []
    day.completed = false
    day.manualCompleted = false
    day.manualMissed = false
    delete day.untrackedWorkout
  } else {
    day.type = 'workout'
    day.manualCompleted = false
    day.manualMissed = false
    day.untrackedWorkout = day.date < isoDate(new Date())
    const template = store.weeklyTemplates.value[store.selectedDayIndex.value]
    const kept = day.savedExercisesForWorkout
    day.exercises = cloneWorkoutExercises(kept?.length ? kept : template?.exercises, day.date)
    delete day.savedExercisesForWorkout
    day.completed = false
  }

  store.saveDayTemplate(day, store.selectedDayIndex.value)
}
