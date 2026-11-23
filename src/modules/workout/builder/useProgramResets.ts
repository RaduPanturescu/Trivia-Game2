import { useToast } from '@/shared/composables/useToast'
import { useWorkoutStore } from '../core/store'
import { useWorkoutTimer } from '../timer/useWorkoutTimer'

/** Public surface of the reset actions. */
export interface ProgramResetsApi {
  /** Archives the current program and starts a week of seven rest days, after a confirm. Saved plans are kept. */
  startNewProgram(): void
  /** Clears stats, the schedule and custom achievement unlocks, after a confirm. Saved plans and other progress are kept. */
  resetAllStats(): void
}

/**
 * Builds the reset actions. Exposed so any dashboard control can reuse the legacy confirms.
 * @returns The actions.
 */
export function useProgramResets(): ProgramResetsApi {
  const store = useWorkoutStore()
  const toast = useToast()
  const timer = useWorkoutTimer()

  return {
    startNewProgram() {
      if (!confirm('Start a new workout program? This clears the current schedule and starts the week with seven rest days and no exercises. Saved plans, achievements, and tracked stats remain.')) return
      timer.resetActive()
      store.resetProgram()
      toast.show({ title: 'New program ready', message: 'All seven days this week are rest days with no exercises.', icon: { emoji: '🆕' } })
    },

    resetAllStats() {
      if (!confirm('Reset workout stats, exercise logs, 1RM records and exercise area assignments, and clear the current workout schedule? Your other app progress and saved workout plans will be kept.')) return
      timer.resetActive()
      store.resetStats()
    },
  }
}
