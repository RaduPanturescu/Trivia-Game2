import type { WorkoutStore } from '../core/store'
import type { WorkoutDay } from '../core/types'

/**
 * The day the user selected in the dashboard: the viewed week's day at `selectedDayIndex`, or Monday when that is missing.
 * Creates the viewed week when it does not exist yet. The returned day is live state: changing it saves.
 * @param store - The workout store.
 * @returns The day, or `null` when the week has no days.
 */
export function getSelectedDay(store: WorkoutStore): WorkoutDay | null {
  const week = store.getViewWeek()
  return week.days[store.selectedDayIndex.value] ?? week.days[0] ?? null
}
