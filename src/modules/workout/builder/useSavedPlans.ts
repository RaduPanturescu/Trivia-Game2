import { computed, ref, type ComputedRef, type Ref } from 'vue'
import { useToast } from '@/shared/composables/useToast'
import { useWorkoutStore } from '../core/store'
import type { WorkoutSavedPlan } from '../core/types'
import { useWorkoutTimer } from '../timer/useWorkoutTimer'

/** Public surface of the saved-plans controls. */
export interface SavedPlansApi {
  /** Saved plans, in the order they were saved. */
  savedPlans: ComputedRef<WorkoutSavedPlan[]>
  /** Id of the plan chosen in the select, or `''`. */
  selectedId: Ref<string>
  /** The chosen plan, or `null` when none is chosen or it was deleted. */
  selectedPlan: ComputedRef<WorkoutSavedPlan | null>
  /**
   * Saves the current program under a name and selects the new plan.
   * @param name - The name as typed.
   * @returns `true` when saved; `false` when the name is blank (a toast says so).
   */
  saveCurrent(name: string): boolean
  /** Chooses a plan in the select. */
  select(planId: string): void
  /** Replaces the current program with the chosen plan, after a confirm. */
  switchToSelected(): void
  /** Renames the chosen plan through a prompt. */
  renameSelected(): void
  /** Deletes the chosen plan, after a confirm. The current program is not changed. */
  deleteSelected(): void
}

/**
 * Builds the saved-plans controls for one panel. Each panel keeps its own selection.
 * @returns The controls.
 */
export function useSavedPlans(): SavedPlansApi {
  const store = useWorkoutStore()
  const toast = useToast()
  const timer = useWorkoutTimer()
  const selectedId = ref('')
  const savedPlans = store.savedPlans
  const selectedPlan = computed(() => savedPlans.value.find((plan) => plan.id === selectedId.value) ?? null)

  return {
    savedPlans,
    selectedId,
    selectedPlan,

    saveCurrent(name) {
      const trimmed = name.trim()
      if (!trimmed) {
        toast.show({ title: 'Plan name required', message: 'Enter a name before saving this workout plan.', icon: { emoji: '⚠️' } })
        return false
      }
      store.saveNamedPlan(trimmed)
      const saved = savedPlans.value[savedPlans.value.length - 1]
      if (saved) selectedId.value = saved.id
      toast.show({ title: 'Workout plan saved', message: `${trimmed} is ready to switch to later.`, icon: { emoji: '💾' } })
      return true
    },

    select(planId) {
      selectedId.value = planId
    },

    switchToSelected() {
      const plan = selectedPlan.value
      if (!plan) return
      if (!confirm(`Switch to “${plan.name}”? Your current workout plan will be replaced by the saved copy.`)) return
      timer.resetActive()
      store.switchPlan(plan.id)
      toast.show({ title: 'Workout plan switched', message: `Loaded ${plan.name}.`, icon: { emoji: '📂' } })
    },

    renameSelected() {
      const plan = selectedPlan.value
      if (!plan) return
      const newName = window.prompt('Enter a new name for this saved workout plan:', plan.name)?.trim()
      if (newName === undefined) return
      if (!newName) {
        toast.show({ title: 'Plan name required', message: 'Enter a name before saving this workout plan.', icon: { emoji: '⚠️' } })
        return
      }
      store.renamePlan(plan.id, newName)
      toast.show({ title: 'Plan name updated', message: `Saved plan renamed to “${newName}”.`, icon: { emoji: '✏️' } })
    },

    deleteSelected() {
      const plan = selectedPlan.value
      if (!plan) return
      if (!confirm(`Delete the saved plan “${plan.name}”? Your current workout program will not be changed.`)) return
      store.deletePlan(plan.id)
      selectedId.value = ''
      toast.show({ title: 'Plan deleted', message: `${plan.name} was removed from saved plans.`, icon: { emoji: '🗑️' } })
    },
  }
}
