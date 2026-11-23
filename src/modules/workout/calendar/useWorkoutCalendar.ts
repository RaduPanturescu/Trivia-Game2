import { computed, ref, watch, type ComputedRef, type Ref } from 'vue'
import { isoDate } from '@/shared/dates'
import { checkWorkoutMilestones } from '../core/milestones'
import { getWorkoutProgramStartDate, isIsoDateString } from '../core/schedule'
import { useWorkoutStore } from '../core/store'
import { applyCalendarDayStatus, type CalendarStatusChoice } from './dayStatus'
import { buildCalendarMonth, monthStartOf, shiftMonth, type CalendarMonth } from './monthGrid'

/** Public surface of the calendar panel's state. */
export interface WorkoutCalendarApi {
  /** The month grid for the shown month. */
  month: ComputedRef<CalendarMonth>
  /** `YYYY-MM-DD` of the day whose status dialog is open, or `null` when closed. */
  editingDate: Ref<string | null>
  /** Shows the previous month. */
  previousMonth(): void
  /** Shows the next month. */
  nextMonth(): void
  /** Opens the status dialog for a day. */
  openStatusEditor(date: string): void
  /** Closes the status dialog without changing anything. */
  closeStatusEditor(): void
  /** Applies a status to the open day, closes the dialog and checks the workout milestones. */
  applyStatus(choice: CalendarStatusChoice): void
}

/**
 * State of the monthly calendar: the shown month (follows the dashboard's viewed week), the grid, and the status
 * dialog. Changes go through the workout store, so they are saved.
 * @returns The calendar API.
 */
export function useWorkoutCalendar(): WorkoutCalendarApi {
  const store = useWorkoutStore()
  const initialWeek = store.viewWeekStart.value
  const month = ref<Date>(monthStartOf(isIsoDateString(initialWeek) ? initialWeek : new Date()))
  const editingDate = ref<string | null>(null)

  // Legacy `renderWorkoutPlanner` snapped the month to the viewed week whenever the week changed.
  watch(() => store.viewWeekStart.value, (weekStart) => {
    if (isIsoDateString(weekStart)) month.value = monthStartOf(weekStart)
  })

  const grid = computed(() => buildCalendarMonth(month.value, {
    program: store.program.value,
    templates: store.weeklyTemplates.value,
    today: isoDate(new Date()),
    activeDate: store.program.value.weeks
      .find((week) => week.weekStart === store.viewWeekStart.value)
      ?.days[store.selectedDayIndex.value]?.date ?? null,
    programStartDate: getWorkoutProgramStartDate(store.storedProgramStartDate.value, store.program.value),
  }))

  /**
   * Applies a status to the open day.
   * @param choice - The status picked in the dialog.
   */
  function applyStatus(choice: CalendarStatusChoice): void {
    const date = editingDate.value
    if (!date) return
    applyCalendarDayStatus(store.program.value, {
      templates: store.weeklyTemplates.value,
      overrides: store.exerciseOverrides.value,
    }, date, choice)
    editingDate.value = null
    checkWorkoutMilestones(store.program.value)
  }

  return {
    month: grid,
    editingDate,
    previousMonth: () => { month.value = shiftMonth(month.value, -1) },
    nextMonth: () => { month.value = shiftMonth(month.value, 1) },
    openStatusEditor: (date) => { editingDate.value = date },
    closeStatusEditor: () => { editingDate.value = null },
    applyStatus,
  }
}
