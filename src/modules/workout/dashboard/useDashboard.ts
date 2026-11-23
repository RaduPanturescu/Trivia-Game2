/**
 * State of the workout dashboard's top half: the viewed week, its day strip, the personal stats, and the week and day
 * navigation. Ports the navigation and metrics parts of the legacy `renderWorkoutPlanner`, `renderWorkoutDays` and
 * `renderWorkoutMetrics`. Day changes go through the workout store, so they are saved.
 */
import { computed, watch, type ComputedRef } from 'vue'
import { useToast } from '@/shared/composables/useToast'
import { formatDisplayDate, isoDate, parseLocalDate } from '@/shared/dates'
import { getMonday, getWorkoutDayIndex, getWorkoutProgramStartDate } from '../core/schedule'
import { useWorkoutStore } from '../core/store'
import type { WorkoutDay, WorkoutStatsSnapshot, WorkoutWeek } from '../core/types'
import { useWorkoutTimer } from '../timer/useWorkoutTimer'
import { buildDayPill, type DayPill } from './dayPills'
import { defineSingleton } from '@/shared/singleton'

/** Public surface of the dashboard's week, day strip and stats. */
export interface WorkoutDashboardApi {
  /** Resolves the store, creates the viewed week and starts checking achievements. Call once after mounting. */
  open(): Promise<void>
  /** The viewed week, or `null` before {@link WorkoutDashboardApi.open} finished. */
  week: ComputedRef<WorkoutWeek | null>
  /** The selected day of the viewed week, or `null`. */
  selectedDay: ComputedRef<WorkoutDay | null>
  /** The week range as text, e.g. `23/11/2026 - 29/11/2026`. */
  weekLabel: ComputedRef<string>
  /** `true` when the viewed week is not the current one, so the "This Week" button shows. */
  showCurrentWeekButton: ComputedRef<boolean>
  /** Pills of the viewed week's days. */
  pills: ComputedRef<DayPill[]>
  /** Headline stats: streak, workouts, sets, reps and kilograms. */
  stats: ComputedRef<WorkoutStatsSnapshot>
  /** Shows the previous week and selects its Monday. */
  previousWeek(): void
  /** Shows the next week and selects its Monday. */
  nextWeek(): void
  /** Shows the current week and selects today. */
  goToCurrentWeek(): void
  /** Selects a day of the viewed week. */
  selectDay(index: number): void
  /**
   * Moves a workout from one day of the viewed week to another, confirming a replacement and reporting refusals.
   * Legacy `moveWorkoutDay`.
   * @param fromIndex - Index of the workout's day.
   * @param toIndex - Index of the day it moves to.
   */
  moveDay(fromIndex: number, toIndex: number): void
}

/** Alert text when a move touches a recorded, missed or active day. Legacy wording. */
const BLOCKED_MOVE_MESSAGE = 'Cannot move a workout to or from a recorded, missed, or active day. Choose an unrecorded day instead.'

/**
 * Builds the dashboard state. Called once by {@link useWorkoutDashboard}.
 * @returns The dashboard API.
 */
function createWorkoutDashboard(): WorkoutDashboardApi {
  const store = useWorkoutStore()
  const timer = useWorkoutTimer()
  const toast = useToast()

  const week = computed<WorkoutWeek | null>(() => store.program.value.weeks.find((item) => item.weekStart === store.viewWeekStart.value) ?? null)
  const selectedDay = computed<WorkoutDay | null>(() => {
    const days = week.value?.days ?? []
    return days[store.selectedDayIndex.value] ?? days[0] ?? null
  })
  const weekLabel = computed(() => {
    if (!week.value) return ''
    const start = parseLocalDate(week.value.weekStart)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    return `${formatDisplayDate(start)} - ${formatDisplayDate(end)}`
  })
  const showCurrentWeekButton = computed(() => store.viewWeekStart.value !== isoDate(getMonday(new Date())))
  const programStart = computed(() => getWorkoutProgramStartDate(store.storedProgramStartDate.value || null, store.program.value))
  const pills = computed<DayPill[]>(() => {
    const today = isoDate(new Date())
    return (week.value?.days ?? []).map((day, index) => buildDayPill(day, index, store.selectedDayIndex.value, today, programStart.value))
  })
  const stats = computed(() => store.getStatsSnapshot())

  /**
   * Shows the week starting at `weekStart`, creating it when missing, and selects the given day.
   * @param weekStart - Monday of the week as `YYYY-MM-DD`.
   * @param dayIndex - Day to select.
   */
  function showWeek(weekStart: string, dayIndex: number): void {
    store.viewWeekStart.value = weekStart
    store.selectedDayIndex.value = dayIndex
    store.getViewWeek()
  }

  /**
   * Shifts the viewed week by whole weeks and selects its Monday.
   * @param direction - `1` for the next week, `-1` for the previous one.
   */
  function shiftWeek(direction: 1 | -1): void {
    const next = parseLocalDate(store.viewWeekStart.value)
    next.setDate(next.getDate() + direction * 7)
    showWeek(isoDate(next), 0)
  }

  let watchingStats = false

  return {
    async open() {
      await store.ready
      store.getViewWeek()
      if (watchingStats) return
      watchingStats = true
      watch(stats, () => store.evaluateAchievements(), { immediate: true })
    },
    week,
    selectedDay,
    weekLabel,
    showCurrentWeekButton,
    pills,
    stats,
    previousWeek: () => shiftWeek(-1),
    nextWeek: () => shiftWeek(1),
    goToCurrentWeek() {
      const today = new Date()
      showWeek(isoDate(getMonday(today)), getWorkoutDayIndex(today))
    },
    selectDay(index) {
      store.selectedDayIndex.value = index
    },
    moveDay(fromIndex, toIndex) {
      const activeDayDate = timer.activeDayDate.value
      let result = store.moveDay(fromIndex, toIndex, { activeDayDate })
      if (result.status === 'needs-confirm') {
        const source = week.value?.days[fromIndex]
        if (!source || !confirm(`Replace the ${result.targetLabel} workout with the ${source.dayLabel} workout? This also changes the recurring schedule.`)) return
        result = store.moveDay(fromIndex, toIndex, { activeDayDate, confirmed: true })
      }
      if (result.status === 'blocked') {
        alert(BLOCKED_MOVE_MESSAGE)
      } else if (result.status === 'moved') {
        toast.show({ title: 'Workout moved', message: `${result.sourceLabel} is now a rest day; ${result.targetLabel} is a workout day.`, icon: { emoji: '✅' } })
      }
    },
  }
}

/**
 * Returns the dashboard state, creating it on first call.
 * @returns The dashboard API.
 */
export const useWorkoutDashboard: () => WorkoutDashboardApi = defineSingleton(createWorkoutDashboard)
